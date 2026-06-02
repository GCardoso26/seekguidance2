"""Warmup endpoint tests."""

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_warmup_endpoint_shape() -> None:
    r = client.get("/runtime/warmup")
    assert r.status_code == 200
    data = r.json()
    assert "embedding_ready" in data
    assert "judge_ready" in data


def test_warmup_detailed() -> None:
    r = client.get("/runtime/warmup/detailed")
    assert r.status_code == 200
    assert "warmup_duration_ms" in r.json()
