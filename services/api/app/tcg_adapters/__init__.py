"""Adaptadores multi-TCG para torneios, decklists e catálogo de cartas."""

from app.tcg_adapters.registry import get_adapter, list_tournament_games
from app.tcg_adapters.types import GAME_CODE_TO_SLUG, SLUG_TO_GAME_CODE

__all__ = [
    "GAME_CODE_TO_SLUG",
    "SLUG_TO_GAME_CODE",
    "get_adapter",
    "list_tournament_games",
]
