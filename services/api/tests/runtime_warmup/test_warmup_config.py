"""Warmup flags e endpoints Judge."""

from unittest.mock import AsyncMock, patch

import pytest
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_judge_warmup_endpoint_shape() -> None:
    r = client.get("/runtime/judge/warmup")
    assert r.status_code == 200
    data = r.json()
    assert "warmup_completed" in data
    assert "metrics" in data


def test_judge_health_includes_warmup_block() -> None:
    payload = {
        "status": "ok",
        "integrity_status": "ok",
        "database": "ok",
        "openai_configured": True,
        "rag_ready_games": 1,
        "total_games": 1,
        "default_chat_model": "gpt-4o-mini",
        "games": [],
        "warmup": {
            "completed": True,
            "duration_ms": 120.0,
            "components_ready": 4,
            "components_total": 4,
        },
    }
    with patch(
        "app.api.v1.runtime_judge.judge_health_payload",
        new_callable=AsyncMock,
        return_value=payload,
    ):
        r = client.get("/runtime/judge/health")
    assert r.status_code == 200
    data = r.json()
    assert data["warmup"]["components_total"] == 4


def test_judge_health_score_endpoint() -> None:
    r = client.get("/runtime/judge/health-score")
    assert r.status_code == 200
    body = r.json()
    assert "score" in body
    assert body["max_score"] == 100


@pytest.mark.asyncio
async def test_warmup_skipped_when_disabled() -> None:
    from app.core.config import Settings
    from app.runtime.runtime_warmup.runtime_warmup_engine_v1 import run_startup_warmup

    cfg = Settings(
        database_url="postgresql://u:p@localhost/db",
        redis_url="redis://localhost:6379/0",
        warmup_enabled=False,
    )
    with patch("app.runtime.runtime_warmup.runtime_warmup_engine_v1._warm_embeddings") as emb:
        result = await run_startup_warmup(cfg)
        emb.assert_not_called()
    assert result.get("completed") is True
