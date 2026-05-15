"""Envelope da API de replay."""

from __future__ import annotations

from app.main import app
from fastapi.testclient import TestClient


def test_validate_returns_envelope() -> None:
    c = TestClient(app)
    r = c.post(
        "/v1/replay/validate",
        json={"replay_ref": "r1", "replay_lineage_id": "lin-1"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "replay_request_id" in body
    assert body["payload"]["replay_ref"] == "r1"
    assert "replay_governance_scores" in body
