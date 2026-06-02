"""Sessões cloud Judge (header X-Judge-User-Id)."""

from __future__ import annotations

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_create_session_requires_user_header() -> None:
    r = client.post(
        "/runtime/judge/session",
        json={"tcg": "magic", "messages": []},
    )
    assert r.status_code == 401


def test_get_session_invalid_uuid() -> None:
    r = client.get("/runtime/judge/session/not-a-uuid")
    assert r.status_code == 400
