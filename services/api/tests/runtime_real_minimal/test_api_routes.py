"""Testes API FastAPI real."""
from __future__ import annotations

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health_route() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_auth_login_route() -> None:
    r = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    assert r.status_code == 200
    assert r.json()["authenticated"] is True


def test_runtime_status_route() -> None:
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    tok = login.json()["tokens"]["access_token"]
    r = client.get("/runtime/status", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert r.json()["integrity_status"] == "ok"


def test_runtime_replay_post() -> None:
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    tok = login.json()["tokens"]["access_token"]
    r = client.post(
        "/runtime/replay",
        json={"scope": "api-test", "payload": {"x": 1}},
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert r.status_code == 200
