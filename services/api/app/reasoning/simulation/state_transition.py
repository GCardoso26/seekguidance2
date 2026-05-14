"""Modelo simbólico de transição de estado (rótulos, sem board real)."""

from __future__ import annotations

from app.reasoning.types import StateSnapshot


def initial_state(question: str, game_slug: str) -> StateSnapshot:
    q = (question or "").lower()
    if "cleanup" in q:
        return StateSnapshot("cleanup_step", "Cleanup / end step context.")
    if game_slug == "yugioh" and "chain" in q:
        return StateSnapshot("open_game_state", "Chain-building context.")
    return StateSnapshot("pre_interaction", "State before resolving the asked interaction.")


def terminal_state() -> StateSnapshot:
    return StateSnapshot("post_interaction", "State after applying ordered rules and checks.")
