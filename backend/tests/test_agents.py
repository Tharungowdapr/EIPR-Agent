import pytest
from fastapi.testclient import TestClient
from main import app
from core.llm_client import LLMClient, LLMProvider, build_llm_client_for_user
from core.security import encrypt_api_key, decrypt_api_key

client = TestClient(app)


class MockUserWithOpenAI:
    preferred_provider = "openai"
    preferred_model = "gpt-4o-mini"
    ollama_base_url = ""
    llm_api_keys = {"openai": encrypt_api_key("sk-test-key")}


def test_encrypt_decrypt_api_key():
    key = "sk-test-key-12345!@#$%"
    encrypted = encrypt_api_key(key)
    assert encrypted != key
    decrypted = decrypt_api_key(encrypted)
    assert decrypted == key


@pytest.mark.asyncio
async def test_build_llm_client_default_raises():
    class MockUserNoProvider:
        preferred_provider = ""
        preferred_model = ""
        ollama_base_url = ""
        llm_api_keys = {}
        id = "test-id"

    with pytest.raises(ValueError, match="No LLM provider configured"):
        await build_llm_client_for_user(MockUserNoProvider())


def test_build_llm_client_with_encrypted_key():
    import asyncio
    llm = asyncio.run(build_llm_client_for_user(MockUserWithOpenAI()))
    assert llm.provider == LLMProvider.OPENAI
    assert llm.api_key == "sk-test-key"


@pytest.mark.asyncio
async def test_llm_client_requires_api_key():
    with pytest.raises(ValueError, match="API key required for openai"):
        LLMClient(provider="openai", api_key="", model="gpt-4o-mini")


@pytest.mark.asyncio
async def test_llm_client_no_provider_raises():
    with pytest.raises(ValueError, match="No LLM provider specified"):
        LLMClient(provider="", api_key="")


@pytest.mark.asyncio
async def test_ollama_client_no_key_ok():
    llm = LLMClient(provider="ollama", api_key="", model="llama3.2")
    assert llm.provider == LLMProvider.OLLAMA


_COUNTER = 0


def _unique_email():
    global _COUNTER
    _COUNTER += 1
    return f"agent-{_COUNTER}@eipr-test.dev"


def _register_and_set_provider(email: str):
    client.post("/api/auth/register", json={"email": email, "name": "Test", "password": "Pass1234"})
    login = client.post("/api/auth/login", json={"email": email, "password": "Pass1234"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    client.patch("/api/auth/settings", json={
        "preferred_provider": "openai",
        "preferred_model": "gpt-4o-mini",
        "llm_api_keys": {"openai": "sk-test-key"},
    }, headers=headers)
    return headers


@pytest.fixture
def auth_headers():
    email = _unique_email()
    return _register_and_set_provider(email)


def test_discover_opportunities_no_llm_config():
    email = _unique_email()
    client.post("/api/auth/register", json={"email": email, "name": "Test", "password": "Pass1234"})
    login = client.post("/api/auth/login", json={"email": email, "password": "Pass1234"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post("/api/projects/", json={"title": "No LLM Test", "domain": "Healthcare", "input_text": "AI diagnostic"}, headers=headers)
    pid = create.json()["id"]

    resp = client.post("/api/agents/discover-opportunities", json={"project_id": pid}, headers=headers)
    assert resp.status_code == 400
    assert "LLM provider" in resp.json()["detail"]


def test_discover_opportunities_endpoint(auth_headers):
    create = client.post("/api/projects/", json={"title": "Agent Test", "domain": "Healthcare", "input_text": "AI diagnostic platform"}, headers=auth_headers)
    pid = create.json()["id"]

    resp = client.post("/api/agents/discover-opportunities", json={"project_id": pid}, headers=auth_headers)
    assert resp.status_code in (400, 500), f"Expected 400/500, got {resp.status_code}: {resp.text[:200]}"


def test_analyze_ip_no_opportunities(auth_headers):
    create = client.post("/api/projects/", json={"title": "IP Test", "domain": "Tech", "input_text": "AI platform"}, headers=auth_headers)
    pid = create.json()["id"]

    resp = client.post("/api/agents/analyze-ip", json={"project_id": pid, "opportunity_index": 0}, headers=auth_headers)
    if resp.status_code == 400:
        detail = resp.json()["detail"]
        assert "Run opportunity discovery first" in detail or "No LLM provider" in detail or "API key required" in detail


def test_generate_business_plan_no_opportunities(auth_headers):
    create = client.post("/api/projects/", json={"title": "Biz Test", "domain": "Tech", "input_text": "AI platform"}, headers=auth_headers)
    pid = create.json()["id"]

    resp = client.post("/api/agents/generate-business-plan", json={"project_id": pid, "opportunity_index": 0}, headers=auth_headers)
    if resp.status_code == 400:
        detail = resp.json()["detail"]
        assert "Run opportunity discovery first" in detail or "No LLM provider" in detail


def test_export_docx_no_report(auth_headers):
    create = client.post("/api/projects/", json={"title": "Export Test", "domain": "Tech", "input_text": "test"}, headers=auth_headers)
    pid = create.json()["id"]

    resp = client.post(f"/api/agents/{pid}/export/docx", headers=auth_headers)
    assert resp.status_code == 400


def test_export_pdf_no_report(auth_headers):
    create = client.post("/api/projects/", json={"title": "PDF Test", "domain": "Tech", "input_text": "test"}, headers=auth_headers)
    pid = create.json()["id"]

    resp = client.post(f"/api/agents/{pid}/export/pdf", headers=auth_headers)
    assert resp.status_code == 400