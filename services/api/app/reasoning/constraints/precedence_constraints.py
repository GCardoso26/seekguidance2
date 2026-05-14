"""Arestas must_precede ativas para o conjunto de papéis presentes."""

from __future__ import annotations

from app.games.constraint_registry import get_game_constraints


def active_must_precede_edges(game_slug: str, roles_present: set[str]) -> list[tuple[str, str]]:
    must = get_game_constraints(game_slug)["must_precede"]
    return [(a, b) for a, b in must if a in roles_present and b in roles_present]
