"""Testes POST /runtime/judge/query."""

from __future__ import annotations

from unittest.mock import AsyncMock

from app.api.deps import get_rag_orchestrator
from app.infrastructure.db.session import get_db_session
from app.main import app
from app.schemas.chat import ChatCitation, ChatResponse
from fastapi.testclient import TestClient

client = TestClient(app)


def test_judge_query_swu_tcg_recognized() -> None:
    from app.judge.registry import game_slug_for_tcg

    assert game_slug_for_tcg("swu") == "swu"
    assert game_slug_for_tcg("star_wars_unlimited") == "swu"


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


def test_judge_query_stream_returns_sse() -> None:
    r = client.post(
        "/runtime/judge/query/stream",
        json={"tcg": "magic", "question": "Como funciona trample?"},
    )
    assert r.status_code == 200
    assert "text/event-stream" in (r.headers.get("content-type") or "")
    body = r.text
    assert '"type": "token"' in body or '"type": "done"' in body


def test_judge_query_sources_include_rule_path() -> None:
    mock = AsyncMock()
    mock.ask = AsyncMock(
        return_value=ChatResponse(
            answer="Trample rules.",
            disclaimer="test",
            citations=[
                ChatCitation(
                    document_title="CR",
                    source_url="https://example.com/cr.pdf",
                    rule_path="702.19",
                    section_path="702.19",
                    excerpt="Trample text",
                    page_number=12,
                )
            ],
            confidence=0.9,
        )
    )

    async def _db():
        yield AsyncMock()

    app.dependency_overrides[get_rag_orchestrator] = lambda: mock
    app.dependency_overrides[get_db_session] = _db
    try:
        r = client.post(
            "/runtime/judge/query",
            json={"tcg": "magic", "question": "trample?"},
        )
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 200
    src = r.json()["sources"][0]
    assert src["rule_path"] == "702.19"
    assert src["page_number"] == 12


def test_judge_games_catalog_endpoint() -> None:
    from unittest.mock import patch

    sample = [
        {
            "tcg_id": "magic",
            "game_slug": "mtg",
            "display_name": "Magic: The Gathering",
            "enabled": True,
            "coming_soon": False,
            "rag_ready": True,
            "chunk_count": 100,
            "last_indexed_at": None,
            "last_chunk_at": None,
        }
    ]

    async def _db():
        yield AsyncMock()

    with patch("app.api.v1.runtime_judge.list_judge_games", new=AsyncMock(return_value=sample)):
        app.dependency_overrides[get_db_session] = _db
        try:
            r = client.get("/runtime/judge/games")
        finally:
            app.dependency_overrides.clear()
    assert r.status_code == 200
    data = r.json()
    assert data["games"][0]["tcg_id"] == "magic"
    assert data["games"][0]["chunk_count"] == 100


def test_judge_health_endpoint() -> None:
    from unittest.mock import patch

    payload = {
        "status": "ok",
        "integrity_status": "ok",
        "database": "ok",
        "openai_configured": True,
        "rag_ready_games": 5,
        "total_games": 13,
        "default_chat_model": "gpt-4o-mini",
        "games": [],
    }

    async def _db():
        yield AsyncMock()

    with patch("app.api.v1.runtime_judge.judge_health_payload", new=AsyncMock(return_value=payload)):
        app.dependency_overrides[get_db_session] = _db
        try:
            r = client.get("/runtime/judge/health")
        finally:
            app.dependency_overrides.clear()
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_judge_rate_limit_returns_429(monkeypatch) -> None:
    from app.core.config import get_settings
    import importlib
    import app.main as main_module

    monkeypatch.setenv("JUDGE_RATE_LIMIT_REQUESTS_PER_MINUTE", "1")
    monkeypatch.setenv("JUDGE_RATE_LIMIT_ENABLED", "true")
    get_settings.cache_clear()
    importlib.reload(main_module)

    c = TestClient(main_module.app)
    headers = {"X-Forwarded-For": "127.0.0.99"}
    body = {"tcg": "swu", "question": "q1"}
    assert c.post("/runtime/judge/query", json=body, headers=headers).status_code == 200
    second = c.post("/runtime/judge/query", json={"tcg": "swu", "question": "q2"}, headers=headers)
    assert second.status_code == 429
    get_settings.cache_clear()
