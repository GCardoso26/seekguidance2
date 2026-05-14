"""Gera ordem válida de papéis via ordenação topológica determinística."""

from __future__ import annotations

from app.reasoning.deterministic.deterministic_solver import solve_deterministic


def generate_valid_role_order(planner_roles: list[str], game_slug: str) -> tuple[list[str] | None, bool]:
    sol = solve_deterministic(planner_roles, game_slug)
    if not sol["ok"]:
        return None, False
    return list(sol["validated_roles"]), True
