"""Agrega deteção de contradições para cadeias e grafos de precedência."""

from __future__ import annotations

from typing import Any

from app.games.constraint_registry import get_game_constraints
from app.reasoning.contradictions.circular_precedence import detect_circular_precedence
from app.reasoning.contradictions.invalid_chain_detector import mutex_violations, ordering_violations
from app.reasoning.contradictions.timing_conflict_detector import detect_timing_conflicts


def detect_contradictions(
    roles_chain: list[str],
    timing_window: str | None,
    game_slug: str,
) -> list[dict[str, Any]]:
    c = get_game_constraints(game_slug)
    must = list(c["must_precede"])
    mutex = list(c["mutex_roles"])
    present = set(roles_chain)
    out: list[dict[str, Any]] = []
    out.extend(ordering_violations(roles_chain, must))
    out.extend(mutex_violations(present, mutex))
    out.extend(detect_timing_conflicts(timing_window, present, game_slug))
    sub_edges = [(a, b) for a, b in must if a in present and b in present]
    out.extend(detect_circular_precedence(sub_edges))
    return out
