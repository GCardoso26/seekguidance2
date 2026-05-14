"""Reasoner temporal de alto nível."""

from __future__ import annotations

from typing import Any

from app.reasoning.temporal.historical_state_simulation import historical_state
from app.reasoning.temporal.replay_time_travel import replay_semantic_differences
from app.reasoning.temporal.semantic_period_resolution import resolve_period
from app.reasoning.temporal.version_aware_execution import runtime_version_for_period


def run_temporal_reasoning(question: str, game_slug: str) -> dict[str, Any]:
    period = resolve_period(question)
    runtime_version = runtime_version_for_period(game_slug, period)
    return {
        "historical_period": period,
        "runtime_version": runtime_version,
        "historical_constraints": [f"period::{period}", f"game::{game_slug}"],
        "semantic_differences": replay_semantic_differences(period),
        "historical_state": historical_state(period),
    }
