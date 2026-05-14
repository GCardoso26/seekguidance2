"""Herança semântica declarativa (multi-TCG)."""

from __future__ import annotations


def inheritance_edges(game_slug: str) -> list[tuple[str, str, str]]:
    """Tuplos (filho, pai, nota)."""
    g = game_slug.lower()
    if g == "mtg":
        return [("triggered_ability", "stack_object", "waits_resolution")]
    if g == "yugioh":
        return [("spell_speed", "chain_link", "builds_chain")]
    return []
