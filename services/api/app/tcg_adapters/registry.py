"""Registry de adaptadores multi-TCG."""

from __future__ import annotations

from app.tcg_adapters.base import GameAdapter
from app.tcg_adapters.lorcana import LorcanaAdapter
from app.tcg_adapters.mtg import MtgAdapter
from app.tcg_adapters.pokemon import PokemonAdapter
from app.tcg_adapters.swu import SwuAdapter
from app.tcg_adapters.types import GAME_CODE_TO_SLUG, SLUG_TO_GAME_CODE, TOURNAMENT_GAME_CODES, GameCode

_ADAPTERS: dict[GameCode, GameAdapter] = {
    "POKEMON": PokemonAdapter(),
    "LORCANA": LorcanaAdapter(),
    "MTG": MtgAdapter(),
    "SWU": SwuAdapter(),
}

_TOURNAMENT_GAMES = [
    {"code": "POKEMON", "slug": "pokemon", "name": "Pokémon TCG", "icon": "pokemon"},
    {"code": "LORCANA", "slug": "lorcana", "name": "Disney Lorcana", "icon": "lorcana"},
    {"code": "MTG", "slug": "mtg", "name": "Magic: The Gathering", "icon": "mtg"},
    {"code": "SWU", "slug": "swu", "name": "Star Wars Unlimited", "icon": "swu"},
]


def normalize_game_code(code: str) -> GameCode:
    upper = code.strip().upper()
    if upper in _ADAPTERS:
        return upper  # type: ignore[return-value]
    slug = code.strip().lower()
    if slug in SLUG_TO_GAME_CODE:
        return SLUG_TO_GAME_CODE[slug]
    raise KeyError(f"Jogo não suportado: {code}")


def get_adapter(code: str) -> GameAdapter:
    return _ADAPTERS[normalize_game_code(code)]


def list_tournament_games() -> list[dict[str, str]]:
    return list(_TOURNAMENT_GAMES)


__all__ = ["GAME_CODE_TO_SLUG", "SLUG_TO_GAME_CODE", "TOURNAMENT_GAME_CODES", "get_adapter", "list_tournament_games", "normalize_game_code"]
