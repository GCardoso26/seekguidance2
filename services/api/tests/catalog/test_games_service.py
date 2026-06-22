"""Testes do serviço de jogos do catálogo."""

from app.catalog.games_service import game_code_from_slug, CODE_TO_SLUG


def test_game_code_from_slug_mtg():
    assert game_code_from_slug("mtg") == "MTG"
    assert game_code_from_slug("magic") == "MTG"


def test_game_code_from_slug_pokemon():
    assert game_code_from_slug("pokemon") == "POKEMON"


def test_game_code_from_slug_yugioh():
    assert game_code_from_slug("yugioh") == "YGO"
    assert game_code_from_slug("ygo") == "YGO"


def test_code_to_slug_mapping():
    assert CODE_TO_SLUG["MTG"] == "mtg"
    assert CODE_TO_SLUG["ONEPIECE"] == "onepiece"
