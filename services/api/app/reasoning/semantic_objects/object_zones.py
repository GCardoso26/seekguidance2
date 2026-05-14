"""Zonas simbólicas por TCG."""

from __future__ import annotations

MTG_ZONES: tuple[str, ...] = (
    "hand",
    "battlefield",
    "graveyard",
    "stack",
    "exile",
    "command",
    "limbo",
)

YGO_ZONES: tuple[str, ...] = ("field", "hand", "deck", "grave", "banish", "chain")

PKM_ZONES: tuple[str, ...] = ("bench", "active", "hand", "deck", "discard", "prizes")


def zones_for_game(game_slug: str) -> tuple[str, ...]:
    if game_slug == "yugioh":
        return YGO_ZONES
    if game_slug == "pokemon":
        return PKM_ZONES
    return MTG_ZONES
