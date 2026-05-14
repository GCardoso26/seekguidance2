"""Conflitos entre janela de timing e papéis presentes."""

from __future__ import annotations

from typing import Any

from app.games.constraint_registry import get_game_constraints


def detect_timing_conflicts(
    window: str | None,
    roles_present: set[str],
    game_slug: str,
) -> list[dict[str, Any]]:
    if not window:
        return []
    req = get_game_constraints(game_slug)["timing_requires"].get(window, ())
    out: list[dict[str, Any]] = []
    for r in req:
        if r not in roles_present:
            out.append(
                {
                    "type": "timing_requirement_unmet",
                    "rules": [r, window],
                    "severity": "high",
                    "reason": f"Timing window '{window}' expects role '{r}' in the validated chain.",
                }
            )
    return out
