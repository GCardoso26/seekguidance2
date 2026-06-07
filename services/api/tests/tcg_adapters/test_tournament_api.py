"""Testes de integração — rotas tournament-system."""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.core.config import Settings, get_settings
from app.infrastructure.db.session import get_db_session
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)
USER = "organizer_test_1"
HEADERS = {"X-Judge-User-Id": USER}


@pytest.fixture(autouse=True)
def _clear():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
    app.dependency_overrides.clear()


@pytest.fixture
def mock_db():
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
def app_with_db(mock_db):
    db, make_result = mock_db

    async def _db():
        yield db

    app.dependency_overrides[get_db_session] = _db
    app.dependency_overrides[get_settings] = lambda: Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://x"),
        redis_url=os.environ.get("REDIS_URL", "redis://x"),
    )
    return db, make_result


class TestTournamentGamesApi:
    def test_list_games(self):
        res = client.get("/runtime/judge/tournament/games")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 4
        assert {g["code"] for g in data} == {"POKEMON", "LORCANA", "MTG", "SWU"}

    def test_parse_mtg_deck(self):
        res = client.post(
            "/runtime/judge/tournament/games/MTG/decklist/parse",
            json={"raw": "4 Lightning Bolt\n56 Island", "format": "STANDARD"},
        )
        assert res.status_code == 200
        assert len(res.json()["main_deck"]) == 2

    def test_validate_pokemon_deck_falha(self):
        res = client.post(
            "/runtime/judge/tournament/games/POKEMON/decklist/validate",
            json={"format": "STANDARD", "raw": "4 Pikachu"},
        )
        assert res.status_code == 200
        assert res.json()["valid"] is False

    def test_banlist_mtg(self):
        res = client.get("/runtime/judge/tournament/games/MTG/banlist?format=STANDARD")
        assert res.status_code == 200
        assert res.json()["game"] == "MTG"

    def test_create_tournament_requires_auth(self):
        res = client.post(
            "/runtime/judge/tournaments",
            json={"name": "Test Open", "game_code": "MTG", "format_code": "STANDARD"},
        )
        assert res.status_code == 401

    def test_create_tournament_success(self, app_with_db):
        db, make_result = app_with_db
        fmt_row = {
            "code": "STANDARD",
            "name": "Standard",
            "default_timer_minutes": 50,
            "default_match_type": "BO3",
            "default_swiss_rounds": "auto",
            "default_top_cut": 8,
            "decklist_required": True,
        }
        created = {
            "id": "uuid-1",
            "name": "Liga MTG",
            "tcg": "mtg",
            "game_code": "MTG",
            "format_code": "STANDARD",
            "status": "draft",
            "created_at": "2026-06-05T00:00:00Z",
        }

        async def execute(stmt, params=None):
            sql = str(stmt)
            if "game_formats" in sql:
                return make_result(first=fmt_row)
            if "INSERT INTO" in sql:
                return make_result(first=created)
            return make_result()

        db.execute = AsyncMock(side_effect=execute)

        res = client.post(
            "/runtime/judge/tournaments",
            headers=HEADERS,
            json={"name": "Liga MTG", "game_code": "MTG", "format_code": "STANDARD"},
        )
        assert res.status_code == 200
        assert res.json()["name"] == "Liga MTG"
