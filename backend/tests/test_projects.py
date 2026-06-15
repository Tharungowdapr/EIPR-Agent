import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


_COUNTER = 0


def _unique_email():
    global _COUNTER
    _COUNTER += 1
    return f"proj-{_COUNTER}@eipr-test.dev"


@pytest.fixture
def auth_headers():
    email = _unique_email()
    client.post("/api/auth/register", json={"email": email, "name": "Proj Test", "password": "Pass1234"})
    login = client.post("/api/auth/login", json={"email": email, "password": "Pass1234"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_project(auth_headers):
    resp = client.post("/api/projects/", json={
        "title": "Test Project",
        "domain": "Healthcare",
        "input_text": "AI-powered diagnostic platform for rural India",
        "user_context": "Team of 2 engineers"
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Test Project"
    assert resp.json()["domain"] == "Healthcare"
    assert resp.json()["current_stage"] == "opportunities"
    return resp.json()["id"]


def test_create_project(auth_headers):
    _create_project(auth_headers)


def test_list_projects(auth_headers):
    _create_project(auth_headers)
    _create_project(auth_headers)

    resp = client.get("/api/projects/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_get_project(auth_headers):
    pid = _create_project(auth_headers)
    resp = client.get(f"/api/projects/{pid}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == pid
    assert "outputs" in resp.json()
    assert "output_versions" in resp.json()


def test_update_stage(auth_headers):
    pid = _create_project(auth_headers)
    resp = client.patch(f"/api/projects/{pid}/stage", json={"stage": "ip"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["stage"] == "ip"

    get = client.get(f"/api/projects/{pid}", headers=auth_headers).json()
    assert get["current_stage"] == "ip"


def test_update_output(auth_headers):
    pid = _create_project(auth_headers)
    data = {"domain_analysis": {"summary": "Test summary"}, "opportunities": []}
    resp = client.put(f"/api/projects/{pid}/output", json={"output_type": "opportunities", "data": data}, headers=auth_headers)
    assert resp.status_code == 200

    get = client.get(f"/api/projects/{pid}", headers=auth_headers).json()
    assert get["outputs"]["opportunities"]["domain_analysis"]["summary"] == "Test summary"
    assert get["output_versions"]["opportunities"]["user_edited"] is True


def test_update_output_version_increment(auth_headers):
    pid = _create_project(auth_headers)
    data = {"test": "version1"}
    client.put(f"/api/projects/{pid}/output", json={"output_type": "test_data", "data": data}, headers=auth_headers)
    data2 = {"test": "version2"}
    resp = client.put(f"/api/projects/{pid}/output", json={"output_type": "test_data", "data": data2}, headers=auth_headers)
    assert resp.status_code == 200

    get = client.get(f"/api/projects/{pid}", headers=auth_headers).json()
    assert get["output_versions"]["test_data"]["version"] == "2"
