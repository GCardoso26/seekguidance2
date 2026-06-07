"""Fixtures compartilhadas — tests/platform/."""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.core.config import Settings, get_settings
from app.infrastructure.db.session import get_db_session
from app.main import app
from app.tcg_adapters.registry import get_adapter
from app.tournament.types import Participant
from fastapi.testclient import TestClient

ORGANIZER_ID = "store_owner_e2e"
PLAYER_IDS = [f"player{i}_e2e" for i in range(1, 9)]


@pytest.fixture
def sample_tournament_data() -> dict:
    return {
        "name": "E2E Test Tournament",
        "game_code": "MTG",
        "format_code": "PIONEER",
        "max_players": 8,
        "timer_minutes": 50,
        "swiss_rounds": "3",
        "top_cut": 4,
        "match_type": "BO3",
    }


@pytest.fixture
def sample_participants() -> list[Participant]:
    return [
        Participant(
            id=f"p{i}",
            user_id=PLAYER_IDS[i - 1],
            display_name=f"Player {i}",
            status="checked_in",
        )
        for i in range(1, 9)
    ]


@pytest.fixture
def mtg_adapter():
    return get_adapter("MTG")


@pytest.fixture
def pokemon_adapter():
    return get_adapter("POKEMON")


@pytest.fixture
def api_client():
    get_settings.cache_clear()
    yield TestClient(app)
    get_settings.cache_clear()
    app.dependency_overrides.clear()


@pytest.fixture
def mock_db_session():
    db = AsyncMock()

    def make_result(rows=None, first=None):
        result = MagicMock()
        mappings = MagicMock()
        mappings.all.return_value = rows or []
        mappings.first.return_value = first
        result.mappings.return_value = mappings
        return result

    db.execute = AsyncMock(side_effect=lambda *a, **k: make_result())
    db.commit = AsyncMock()
    return db, make_result


@pytest.fixture
def api_client_with_db(mock_db_session):
    db, make_result = mock_db_session

    async def _db():
        yield db

    app.dependency_overrides[get_db_session] = _db
    app.dependency_overrides[get_settings] = lambda: Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://x"),
        redis_url=os.environ.get("REDIS_URL", "redis://x"),
    )
    get_settings.cache_clear()
    client = TestClient(app)
    yield client, db, make_result
    app.dependency_overrides.clear()
    get_settings.cache_clear()


@pytest.fixture
def organizer_headers() -> dict[str, str]:
    return {"X-Judge-User-Id": ORGANIZER_ID}


@pytest.fixture
def player_headers() -> list[dict[str, str]]:
    return [{"X-Judge-User-Id": uid} for uid in PLAYER_IDS]
