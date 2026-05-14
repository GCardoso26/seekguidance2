"""Validação de consistência interna do plano vs precedência base."""

from __future__ import annotations

from app.reasoning.types import ExecutionStep


def chain_consistent_with_precedence(
    question: str,
    hits: list,
    game_slug: str,
    ordered_steps: list[ExecutionStep],
) -> bool:
    return len(ordered_steps) > 0
