"""Heurísticas de equivalência semântica cross-game (referência, não prova formal)."""

from __future__ import annotations

from typing import Any


def equivalence_hint(from_game: str, subsystem: str) -> dict[str, Any]:
    """Ex.: STACK ≈ CHAIN como *janela ordenada de resolução* (não identidade mecânica)."""
    g = from_game.lower()
    s = subsystem.lower()
    table: dict[tuple[str, str], tuple[str, str, str]] = {
        ("mtg", "stack"): ("yugioh", "chain", "ordered_resolution_window"),
        ("yugioh", "chain"): ("mtg", "stack", "ordered_resolution_window"),
        ("mtg", "sba"): ("digimon", "memory_threshold", "automatic_state_transition"),
    }
    tgt = table.get((g, s))
    if not tgt:
        return {"equivalent": False, "note": "no_cross_game_hint"}
    return {"equivalent": "soft", "target_game": tgt[0], "target_subsystem": tgt[1], "relation": tgt[2]}
