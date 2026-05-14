"""Resolução determinística de precedência."""

from app.reasoning.deterministic.deterministic_solver import (
    build_steps_from_validated_roles,
    solve_deterministic,
)

__all__ = ["build_steps_from_validated_roles", "solve_deterministic"]
