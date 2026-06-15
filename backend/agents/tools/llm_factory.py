from typing import Optional, Any
from core.config import settings
from core.security import decrypt_api_key
import logging

logger = logging.getLogger(__name__)

def create_langchain_llm(provider: str, api_key: str = "", model: str = "", base_url: str = ""):
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic
    from langchain_groq import ChatGroq

    provider = provider.lower()
    api_key = api_key or ""
    model = model or ""
    base_url = base_url or ""

    if not model:
        defaults = {
            "openai": "gpt-4o-mini",
            "anthropic": "claude-3-haiku-20240307",
            "groq": "llama-3.3-70b-versatile",
            "gemini": "gemini-1.5-flash",
            "cohere": "command-r",
            "ollama": "llama3.2",
            "openrouter": "meta-llama/llama-3.1-8b-instruct:free",
        }
        model = defaults.get(provider, "llama3.2")

    if provider == "openai":
        return ChatOpenAI(model=model, api_key=api_key, temperature=0.7)
    elif provider == "anthropic":
        return ChatAnthropic(model=model, api_key=api_key, temperature=0.7)
    elif provider == "groq":
        return ChatGroq(model=model, api_key=api_key, temperature=0.7)
    elif provider == "gemini":
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model=model, api_key=api_key, temperature=0.7)
        except ImportError:
            raise ValueError("Gemini provider requires: pip install langchain-google-genai")
    elif provider == "cohere":
        try:
            from langchain_cohere import ChatCohere
            return ChatCohere(model=model, api_key=api_key, temperature=0.7)
        except ImportError:
            raise ValueError("Cohere provider requires: pip install langchain-cohere")
    elif provider == "ollama":
        try:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(model=model, base_url=base_url or "http://localhost:11434", temperature=0.7)
        except ImportError:
            raise ValueError("Ollama provider requires: pip install langchain-community")
    elif provider == "openrouter":
        return ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.7,
            default_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "EIPR-Agent"},
        )
    else:
        raise ValueError(f"Unsupported provider: {provider}")


def create_llm_from_user(user: Any):
    provider = user.preferred_provider or settings.DEFAULT_LLM_PROVIDER
    api_keys = user.llm_api_keys or {}
    raw_key = api_keys.get(provider) or ""
    api_key = ""
    if raw_key:
        try:
            api_key = decrypt_api_key(raw_key)
        except Exception:
            logger.warning(f"Failed to decrypt API key for {provider}")
            api_key = raw_key
    model = user.preferred_model or ""
    base_url = user.ollama_base_url or settings.OLLAMA_BASE_URL
    return create_langchain_llm(provider, api_key, model, base_url)
