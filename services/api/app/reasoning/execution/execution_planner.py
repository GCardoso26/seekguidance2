"""Plano de execução com limite de profundidade (anti-explosão)."""

from __future__ import annotations

from app.core.config import Settings
from app.reasoning.execution.ordering_engine import build_ordered_steps
from app.reasoning.types import ExecutionStep


def plan_execution(
    question: str,
    hits: list,
    game_slug: str,
    settings: Settings | None = None,
) -> list[ExecutionStep]:
    max_depth = 12
    if settings is not None:
        max_depth = max(4, min(24, getattr(settings, "reasoning_max_chain_depth", 12)))
    return build_ordered_steps(question, hits, game_slug, max_depth=max_depth)
