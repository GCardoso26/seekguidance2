"""Rotas /v1/replay (smoke leve)."""

from __future__ import annotations

from app.main import app
from fastapi.testclient import TestClient


def test_replay_health_get() -> None:
    c = TestClient(app)
    r = c.get("/v1/replay/health")
    assert r.status_code == 200
    body = r.json()
    assert "status" in body or "replay_health_summary" in body


def test_replay_validate_post() -> None:
    c = TestClient(app)
    r = c.post("/v1/replay/validate", json={"replay_ref": "r1"})
    assert r.status_code == 200
    body = r.json()
    assert body["payload"]["replay_ref"] == "r1"
    assert "replay_request_id" in body
