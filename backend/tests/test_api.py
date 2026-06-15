import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

_COUNTER = 0


def _email():
    global _COUNTER
    _COUNTER += 1
    return f"api-test-{_COUNTER}@eipr-test.dev"


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register():
    email = _email()
    resp = client.post("/api/auth/register", json={
        "email": email,
        "name": "Test User",
        "password": "testpass123"
    })
    assert resp.status_code == 200
    assert "user" in resp.json()


def test_login():
    email = _email()
    client.post("/api/auth/register", json={"email": email, "name": "Login", "password": "testpass123"})
    resp = client.post("/api/auth/login", json={"email": email, "password": "testpass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_create_project():
    email = _email()
    client.post("/api/auth/register", json={"email": email, "name": "Proj", "password": "pass123"})
    login_resp = client.post("/api/auth/login", json={"email": email, "password": "pass123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/projects/", json={
        "title": "Test Project",
        "domain": "Healthcare",
        "input_text": "AI healthcare startup"
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Test Project"
