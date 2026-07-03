"""Testes do catálogo vendedor."""

from app.marketplace.seller_catalog import DEFAULT_GAME_CONFIG
from app.catalog.games_service import game_code_from_slug


def test_default_game_config_has_conditions():
    assert "NM" in DEFAULT_GAME_CONFIG["conditions"]
    assert "pt" in DEFAULT_GAME_CONFIG["languages"]


def test_game_slug_mtg():
    assert game_code_from_slug("mtg") == "MTG"
    assert game_code_from_slug("magic") == "MTG"


def test_game_slug_pokemon():
    assert game_code_from_slug("pokemon") == "POKEMON"


def test_catalog_search_contract():
    sample = {"cards": [], "total": 0, "page": 1, "limit": 24, "has_more": False}
    assert "cards" in sample
