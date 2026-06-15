import httpx
import json
import logging
import asyncio
from typing import Optional, AsyncGenerator
from enum import Enum
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception, RetryError
from httpx import HTTPStatusError, RequestError

logger = logging.getLogger(__name__)

RETRYABLE_STATUSES = {429, 502, 503, 504}


def _is_retryable_error(exc: BaseException) -> bool:
    if isinstance(exc, RequestError):
        return True
    if isinstance(exc, HTTPStatusError):
        return exc.response.status_code in RETRYABLE_STATUSES
    return False


def _log_retry(retry_state):
    exc = retry_state.outcome.exception()
    logger.warning(f"LLM call attempt {retry_state.attempt_number} failed: {type(exc).__name__}: {exc}")


class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GROQ = "groq"
    GEMINI = "gemini"
    COHERE = "cohere"
    MISTRAL = "mistral"
    TOGETHER = "together"
    DEEPSEEK = "deepseek"
    OLLAMA = "ollama"
    OPENROUTER = "openrouter"


PROVIDER_DEFAULTS = {
    LLMProvider.OPENAI: "gpt-4o-mini",
    LLMProvider.ANTHROPIC: "claude-3-haiku-20240307",
    LLMProvider.GROQ: "llama-3.3-70b-versatile",
    LLMProvider.GEMINI: "gemini-1.5-flash",
    LLMProvider.COHERE: "command-r",
    LLMProvider.MISTRAL: "mistral-small-latest",
    LLMProvider.TOGETHER: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    LLMProvider.DEEPSEEK: "deepseek-chat",
    LLMProvider.OLLAMA: "llama3.2",
    LLMProvider.OPENROUTER: "meta-llama/llama-3.1-8b-instruct:free",
}


class LLMClient:
    CLOUD_PROVIDERS = {"openai", "anthropic", "groq", "gemini", "cohere", "mistral", "together", "deepseek", "openrouter"}

    def __init__(
        self,
        provider: str = "ollama",
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ):
        self.provider = LLMProvider(provider) if provider else None
        if not self.provider:
            raise ValueError("No LLM provider specified.")
        self.api_key = api_key
        self.model = model or PROVIDER_DEFAULTS.get(self.provider, "llama3.2")
        self.temperature = temperature
        self.max_tokens = max_tokens

        if provider in self.CLOUD_PROVIDERS and not api_key:
            raise ValueError(
                f"API key required for {provider}. "
                f"Go to Settings > AI Settings to add your {provider} API key."
            )

        self.base_urls = {
            LLMProvider.OPENAI: "https://api.openai.com/v1",
            LLMProvider.ANTHROPIC: "https://api.anthropic.com/v1",
            LLMProvider.GROQ: "https://api.groq.com/openai/v1",
            LLMProvider.GEMINI: "https://generativelanguage.googleapis.com/v1beta",
            LLMProvider.COHERE: "https://api.cohere.ai/v1",
            LLMProvider.MISTRAL: "https://api.mistral.ai/v1",
            LLMProvider.TOGETHER: "https://api.together.xyz/v1",
            LLMProvider.DEEPSEEK: "https://api.deepseek.com/v1",
            LLMProvider.OLLAMA: base_url or "http://localhost:11434",
            LLMProvider.OPENROUTER: "https://openrouter.ai/api/v1",
        }
        if base_url and self.provider == LLMProvider.OLLAMA:
            self.base_urls[LLMProvider.OLLAMA] = base_url.rstrip("/")

    @retry(wait=wait_exponential(min=2, max=60), stop=stop_after_attempt(10), retry=retry_if_exception(_is_retryable_error), before_sleep=_log_retry)
    async def _complete_with_retry(self, prompt: str, system: Optional[str] = None, json_mode: bool = False) -> str:
        dispatcher = {
            LLMProvider.OPENAI: self._openai_complete,
            LLMProvider.ANTHROPIC: self._anthropic_complete,
            LLMProvider.GROQ: self._openai_complete,
            LLMProvider.GEMINI: self._gemini_complete,
            LLMProvider.COHERE: self._cohere_complete,
            LLMProvider.MISTRAL: self._openai_complete,
            LLMProvider.TOGETHER: self._openai_complete,
            LLMProvider.DEEPSEEK: self._openai_complete,
            LLMProvider.OLLAMA: self._ollama_complete,
            LLMProvider.OPENROUTER: self._openai_complete,
        }
        handler = dispatcher.get(self.provider)
        if not handler:
            raise ValueError(f"Unsupported provider: {self.provider}")
        return await handler(prompt, system, json_mode)

    async def complete(self, prompt: str, system: Optional[str] = None, json_mode: bool = False) -> str:
        try:
            return await self._complete_with_retry(prompt, system, json_mode)
        except RetryError as e:
            last = e.last_attempt
            if last and last.failed:
                exc = last.exception()
                status = ""
                if isinstance(exc, HTTPStatusError):
                    status = f" (HTTP {exc.response.status_code})"
                logger.error(f"LLM call failed after 10 retries{status}: {exc}")
                msg = f"AI provider ({self.provider}) unavailable after 10 retries{status}. "
                if self.provider.value == "groq":
                    msg += "Groq free tier may be rate limited. Switch to Ollama in Settings > AI Settings, or wait and retry."
                else:
                    msg += "Check your provider status or switch to Ollama in Settings."
                raise RuntimeError(msg) from None
            raise

    async def stream_complete(self, prompt: str, system: Optional[str] = None, json_mode: bool = False) -> AsyncGenerator[str, None]:
        dispatcher = {
            LLMProvider.OPENAI: self._openai_stream,
            LLMProvider.ANTHROPIC: self._anthropic_stream,
            LLMProvider.GROQ: self._openai_stream,
            LLMProvider.GEMINI: self._gemini_stream,
            LLMProvider.COHERE: self._cohere_stream,
            LLMProvider.MISTRAL: self._openai_stream,
            LLMProvider.TOGETHER: self._openai_stream,
            LLMProvider.DEEPSEEK: self._openai_stream,
            LLMProvider.OLLAMA: self._ollama_stream,
            LLMProvider.OPENROUTER: self._openai_stream,
        }
        handler = dispatcher.get(self.provider)
        if not handler:
            raise ValueError(f"Unsupported provider: {self.provider}")
        async for chunk in handler(prompt, system, json_mode):
            yield chunk

    async def _openai_complete(self, prompt: str, system: Optional[str], json_mode: bool) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system[:5000] if len(system) > 5000 else system})
        messages.append({"role": "user", "content": prompt[:30000] if len(prompt) > 30000 else prompt})
        payload = {"model": self.model, "messages": messages, "temperature": self.temperature, "max_tokens": self.max_tokens}
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        base = self.base_urls[self.provider]
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{base}/chat/completions", json=payload, headers=headers)
            if resp.status_code == 429:
                raise HTTPStatusError(f"Rate limited (429)", request=resp.request, response=resp)
            if resp.status_code == 400:
                body = await resp.aread()
                logger.error(f"Groq 400 error: {body.decode('utf-8', errors='replace')[:500]}")
                resp.raise_for_status()
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def _openai_stream(self, prompt: str, system: Optional[str], json_mode: bool) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": system}] if system else []
        messages.append({"role": "user", "content": prompt})
        payload = {"model": self.model, "messages": messages, "temperature": self.temperature, "max_tokens": self.max_tokens, "stream": True}
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        base = self.base_urls[self.provider]
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{base}/chat/completions", headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        line = line[6:]
                        if line == "[DONE]":
                            break
                        try:
                            data = json.loads(line)
                            if data["choices"][0]["delta"].get("content"):
                                yield data["choices"][0]["delta"]["content"]
                        except:
                            pass

    async def _anthropic_complete(self, prompt: str, system: Optional[str], json_mode: bool) -> str:
        payload = {"model": self.model, "max_tokens": self.max_tokens, "messages": [{"role": "user", "content": prompt}]}
        if system:
            payload["system"] = system
        if json_mode:
            payload["system"] = (system or "") + "\nRespond with valid JSON only."
        headers = {"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{self.base_urls[LLMProvider.ANTHROPIC]}/messages", json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]

    async def _anthropic_stream(self, prompt: str, system: Optional[str], json_mode: bool) -> AsyncGenerator[str, None]:
        payload = {"model": self.model, "messages": [{"role": "user", "content": prompt}], "max_tokens": self.max_tokens, "temperature": self.temperature, "stream": True}
        if system:
            payload["system"] = system
        headers = {"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{self.base_urls[LLMProvider.ANTHROPIC]}/messages", headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if data.get("type") == "content_block_delta" and "text" in data.get("delta", {}):
                                yield data["delta"]["text"]
                        except:
                            pass

    async def _gemini_complete(self, prompt: str, system: Optional[str], json_mode: bool) -> str:
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        payload = {"contents": [{"parts": [{"text": full_prompt}]}], "generationConfig": {"temperature": self.temperature, "maxOutputTokens": self.max_tokens}}
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"
        url = f"{self.base_urls[LLMProvider.GEMINI]}/models/{self.model}:generateContent?key={self.api_key}"
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    async def _gemini_stream(self, prompt: str, system: Optional[str], json_mode: bool) -> AsyncGenerator[str, None]:
        payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": self.temperature, "maxOutputTokens": self.max_tokens}}
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"
        url = f"{self.base_urls[LLMProvider.GEMINI]}/models/{self.model}:streamGenerateContent?alt=sse&key={self.api_key}"
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if "candidates" in data and data["candidates"]:
                                parts = data["candidates"][0].get("content", {}).get("parts", [])
                                if parts and "text" in parts[0]:
                                    yield parts[0]["text"]
                        except:
                            pass

    async def _cohere_complete(self, prompt: str, system: Optional[str], json_mode: bool) -> str:
        payload = {"model": self.model, "message": prompt, "temperature": self.temperature, "max_tokens": self.max_tokens}
        if system:
            payload["preamble"] = system
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{self.base_urls[LLMProvider.COHERE]}/chat", json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()["text"]

    async def _cohere_stream(self, prompt: str, system: Optional[str], json_mode: bool) -> AsyncGenerator[str, None]:
        payload = {"model": self.model, "message": prompt, "temperature": self.temperature, "max_tokens": self.max_tokens, "stream": True}
        if system:
            payload["preamble"] = system
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{self.base_urls[LLMProvider.COHERE]}/chat", headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if data.get("event_type") == "text-generation":
                                yield data["text"]
                        except:
                            pass

    async def _ollama_complete(self, prompt: str, system: Optional[str], json_mode: bool) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        payload = {"model": self.model, "messages": messages, "stream": False, "options": {"temperature": self.temperature, "num_predict": self.max_tokens}}
        if json_mode:
            payload["format"] = "json"
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(f"{self.base_urls[LLMProvider.OLLAMA]}/api/chat", json=payload)
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    async def _ollama_stream(self, prompt: str, system: Optional[str], json_mode: bool) -> AsyncGenerator[str, None]:
        payload = {"model": self.model, "messages": [{"role": "user", "content": prompt}], "stream": True, "options": {"temperature": self.temperature, "num_predict": self.max_tokens}}
        if system:
            payload["messages"].insert(0, {"role": "system", "content": system})
        if json_mode:
            payload["format"] = "json"
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{self.base_urls[LLMProvider.OLLAMA]}/api/chat", json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                        except:
                            pass

    async def test_connection(self) -> dict:
        try:
            original_max = self.max_tokens
            self.max_tokens = 10
            result = await self.complete("Say 'OK' in exactly one word.")
            self.max_tokens = original_max
            return {"success": True, "response": result[:50]}
        except Exception as e:
            return {"success": False, "error": str(e)}


async def build_llm_client_for_user(user) -> LLMClient:
    from core.config import settings
    from core.security import decrypt_api_key as _decrypt
    provider = user.preferred_provider or settings.DEFAULT_LLM_PROVIDER
    if not provider:
        raise ValueError(
            "No LLM provider configured. Go to Settings > AI Settings to select a provider "
            "and enter your API key."
        )
    api_keys = user.llm_api_keys or {}
    raw_key = api_keys.get(provider) or ""
    api_key = ""
    if raw_key:
        try:
            api_key = _decrypt(raw_key)
        except Exception:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to decrypt API key for {provider}")
            raise ValueError(
                f"Stored API key for {provider} is corrupted. Please re-enter it in Settings > AI Settings."
            )
    model = user.preferred_model or ""
    base_url = user.ollama_base_url or settings.OLLAMA_BASE_URL
    return LLMClient(provider=provider, api_key=api_key, model=model, base_url=base_url)


async def get_ollama_models(base_url: str = "http://localhost:11434") -> list:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{base_url.rstrip('/')}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            return [{"id": m["name"], "name": m["name"], "size": f"{m.get('size', 0) / 1e9:.1f}GB", "context": "varies"} for m in data.get("models", [])]
    except Exception:
        return []


async def get_provider_models(provider: str, api_key: str = "", base_url: str = "") -> list:
    try:
        prov = LLMProvider(provider)
    except ValueError:
        return []

    if prov == LLMProvider.OLLAMA:
        return await get_ollama_models(base_url)

    base_urls = {
        LLMProvider.OPENAI: "https://api.openai.com/v1",
        LLMProvider.ANTHROPIC: "https://api.anthropic.com/v1",
        LLMProvider.GROQ: "https://api.groq.com/openai/v1",
        LLMProvider.GEMINI: "https://generativelanguage.googleapis.com/v1beta",
        LLMProvider.COHERE: "https://api.cohere.ai/v1",
        LLMProvider.MISTRAL: "https://api.mistral.ai/v1",
        LLMProvider.TOGETHER: "https://api.together.xyz/v1",
        LLMProvider.DEEPSEEK: "https://api.deepseek.com/v1",
        LLMProvider.OPENROUTER: "https://openrouter.ai/api/v1",
    }

    url_base = base_urls.get(prov)
    if not url_base:
        return []

    url = f"{url_base}/models"
    headers = {}

    if prov == LLMProvider.GEMINI:
        url = f"{url}?key={api_key}"
    elif prov == LLMProvider.ANTHROPIC:
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
    else:
        headers = {"Authorization": f"Bearer {api_key}"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        if prov == LLMProvider.GEMINI:
            return [
                {"id": m["name"].replace("models/", ""), "name": m["name"].replace("models/", ""), "size": ""}
                for m in data.get("models", [])
            ]

        return [
            {"id": m["id"], "name": m["display_name"] if m.get("display_name") else m["id"], "size": ""}
            for m in data.get("data", [])
        ]
    except Exception:
        return []
