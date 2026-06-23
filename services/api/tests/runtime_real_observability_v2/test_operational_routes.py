from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def _auth_headers() -> dict[str, str]:
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    assert login.status_code == 200
    tok = login.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {tok}"}


def test_metrics_endpoint() -> None:
    r = client.get("/metrics")
    assert r.status_code == 200


def test_runtime_health_deep() -> None:
    r = client.get("/runtime/health")
    assert r.status_code == 200
    assert r.json()["integrity_status"] == "ok"


def test_runtime_diagnostics() -> None:
    r = client.get("/runtime/diagnostics")
    assert r.status_code == 200


def test_pilot_enroll() -> None:
    r = client.post(
        "/runtime/pilot",
        json={"user_id": "pilot-1", "tenant_id": "default"},
        headers=_auth_headers(),
    )
    assert r.status_code == 200


def test_incident_report() -> None:
    r = client.post(
        "/runtime/incidents",
        json={"summary": "test incident", "tenant_id": "default"},
        headers=_auth_headers(),
    )
    assert r.status_code == 200


def test_backup_endpoint() -> None:
    r = client.post("/runtime/backup", json={})
    assert r.status_code == 200
    assert r.json()["integrity_status"] == "ok"
