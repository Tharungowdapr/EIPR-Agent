import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


_COUNTER = 0


def _unique_email(base="test"):
    global _COUNTER
    _COUNTER += 1
    return f"{base}-{_COUNTER}@eipr-test.dev"


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_and_login():
    email = _unique_email("auth")
    reg = client.post("/api/auth/register", json={"email": email, "name": "Auth Tester", "password": "pass123"})
    assert reg.status_code == 200
    assert reg.json()["user"]["email"] == email

    login = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    assert login.status_code == 200
    assert "access_token" in login.json()
    assert "refresh_token" in login.json()


def test_register_duplicate():
    email = _unique_email("dup")
    client.post("/api/auth/register", json={"email": email, "name": "Dup", "password": "pass123"})
    resp = client.post("/api/auth/register", json={"email": email, "name": "Dup2", "password": "pass456"})
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


def test_login_wrong_password():
    email = _unique_email("wrong")
    client.post("/api/auth/register", json={"email": email, "name": "Wrong", "password": "correct"})
    resp = client.post("/api/auth/login", json={"email": email, "password": "wrong"})
    assert resp.status_code == 401


def test_me_endpoint():
    email = _unique_email("me")
    client.post("/api/auth/register", json={"email": email, "name": "Me Tester", "password": "pass123"})
    login = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == email
    assert data["name"] == "Me Tester"
    assert "preferred_provider" in data
    assert "providers_with_keys" in data


def test_update_settings():
    email = _unique_email("settings")
    client.post("/api/auth/register", json={"email": email, "name": "Settings", "password": "pass123"})
    login = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.patch("/api/auth/settings", json={"preferred_provider": "openai", "preferred_model": "gpt-4"}, headers=headers)
    assert resp.status_code == 200

    me = client.get("/api/auth/me", headers=headers).json()
    assert me["preferred_provider"] == "openai"
    assert me["preferred_model"] == "gpt-4"


def test_update_settings_with_api_key():
    email = _unique_email("apikey")
    client.post("/api/auth/register", json={"email": email, "name": "API Key", "password": "pass123"})
    login = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.patch("/api/auth/settings", json={"llm_api_keys": {"openai": "sk-test-key-12345"}}, headers=headers)
    assert resp.status_code == 200

    me = client.get("/api/auth/me", headers=headers).json()
    assert me["providers_with_keys"].get("openai") is True


def test_test_llm_endpoint():
    email = _unique_email("testllm")
    client.post("/api/auth/register", json={"email": email, "name": "TestLLM", "password": "pass123"})
    login = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/auth/test-llm", headers=headers)
    assert resp.status_code == 200
    assert "success" in resp.json()


def test_ollama_models_endpoint():
    email = _unique_email("ollama")
    client.post("/api/auth/register", json={"email": email, "name": "Ollama", "password": "pass123"})
    login = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/auth/ollama/models", headers=headers)
    assert resp.status_code == 200
    assert "models" in resp.json()


def test_refresh_token():
    email = _unique_email("refresh")
    client.post("/api/auth/register", json={"email": email, "name": "Refresh", "password": "pass123"})
    login = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    refresh_token = login.json()["refresh_token"]

    resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_unauthorized_access():
    resp = client.get("/api/auth/me")
    assert resp.status_code == 403 or resp.status_code == 401


def test_delete_project():
    email = _unique_email("delete")
    client.post("/api/auth/register", json={"email": email, "name": "Delete", "password": "pass123"})
    login = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post("/api/projects/", json={"title": "To Delete", "domain": "Test", "input_text": "test"}, headers=headers)
    pid = create.json()["id"]
    resp = client.delete(f"/api/projects/{pid}", headers=headers)
    assert resp.status_code == 200

    get = client.get(f"/api/projects/{pid}", headers=headers)
    assert get.status_code == 404
