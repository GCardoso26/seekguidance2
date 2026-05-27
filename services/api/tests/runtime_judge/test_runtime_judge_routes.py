"""Testes POST /runtime/judge/query."""

from __future__ import annotations

from unittest.mock import AsyncMock

from app.api.deps import get_rag_orchestrator
from app.infrastructure.db.session import get_db_session
from app.main import app
from app.schemas.chat import ChatCitation, ChatResponse
from fastapi.testclient import TestClient

client = TestClient(app)


def test_judge_query_coming_soon_tcg() -> None:
    r = client.post(
        "/runtime/judge/query",
        json={"tcg": "swu", "question": "How do you win?"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is False
    assert "em breve" in data["answer"].lower() or "breve" in data["answer"].lower()


def test_judge_query_trample_mock_fallback() -> None:
    r = client.post(
        "/runtime/judge/query",
        json={"tcg": "magic", "question": "Como funciona trample?"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert "trample" in data["answer"].lower()


def test_judge_query_magic_rag() -> None:
    mock = AsyncMock()
    mock.ask = AsyncMock(
        return_value=ChatResponse(
            answer="Priority rules apply.",
            disclaimer="test",
            citations=[
                ChatCitation(
                    document_title="CR",
                    source_url="https://example.com",
                    excerpt="rule text",
                )
            ],
            confidence=0.88,
        )
    )

    async def _db():
        yield AsyncMock()

    app.dependency_overrides[get_rag_orchestrator] = lambda: mock
    app.dependency_overrides[get_db_session] = _db
    try:
        r = client.post(
            "/runtime/judge/query",
            json={"tcg": "magic", "question": "What is priority?"},
        )
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert data["answer"] == "Priority rules apply."
    assert data["confidence"] == 0.88
    assert len(data["sources"]) >= 1


def test_judge_query_digimon_rag_slug() -> None:
    mock = AsyncMock()
    mock.ask = AsyncMock(
        return_value=ChatResponse(
            answer="Digivolution rules.",
            disclaimer="test",
            citations=[],
            confidence=0.7,
        )
    )

    async def _db():
        yield AsyncMock()

    app.dependency_overrides[get_rag_orchestrator] = lambda: mock
    app.dependency_overrides[get_db_session] = _db
    try:
        r = client.post(
            "/runtime/judge/query",
            json={"tcg": "digimon", "question": "How does digivolution work?"},
        )
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    mock.ask.assert_awaited_once()
    req = mock.ask.await_args.args[1]
    assert req.game_slug == "digimon"
