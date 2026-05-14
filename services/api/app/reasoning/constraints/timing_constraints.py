"""Regras de timing formalizadas (papéis exigidos por janela)."""

from __future__ import annotations

from app.games.constraint_registry import get_game_constraints


def timing_requires_for_window(game_slug: str, window: str | None) -> tuple[str, ...]:
    if not window:
        return ()
    return tuple(get_game_constraints(game_slug)["timing_requires"].get(window, ()))


def timing_roles_satisfied(window: str | None, roles_present: set[str], game_slug: str) -> bool:
    for r in timing_requires_for_window(game_slug, window):
        if r not in roles_present:
            return False
    return True
