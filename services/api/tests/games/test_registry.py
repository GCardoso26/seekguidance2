from __future__ import annotations

from app.core.config import Settings
from app.games.registry import normalize_game_slug


def test_normalize_aliases() -> None:
    assert normalize_game_slug("ONE_PIECE") == "onepiece"
    assert normalize_game_slug("op tcg") == "onepiece"
    assert normalize_game_slug("fab") == "fab"


def test_rag_allowed_slugs() -> None:
    s = Settings(
        database_url="postgresql+asyncpg://x@y/z",
        redis_url="redis://localhost/0",
        rag_allowed_game_slugs="mtg,pokemon",
    )
    assert s.is_rag_enabled_for_game("mtg")
    assert s.is_rag_enabled_for_game("pokemon")
    assert not s.is_rag_enabled_for_game("yugioh")
