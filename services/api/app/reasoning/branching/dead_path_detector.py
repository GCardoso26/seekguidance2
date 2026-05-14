"""Deteta caminhos que terminam em estados ilegais."""

from __future__ import annotations

from app.reasoning.state_engine.state_legality import validate_state_legality
from app.reasoning.state_engine.state_transition_engine import evolve_along_roles


def dead_paths(
    candidate_roles_paths: list[list[str]],
    question: str,
    game_slug: str,
) -> list[list[str]]:
    dead: list[list[str]] = []
    for path in candidate_roles_paths:
        states, _ = evolve_along_roles(path, question, game_slug)
        final = states[-1]
        leg = validate_state_legality(final, game_slug)
        if not leg["state_valid"]:
            dead.append(path)
    return dead
