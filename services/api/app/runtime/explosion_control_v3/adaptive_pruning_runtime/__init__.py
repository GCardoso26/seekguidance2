"""Pruning adaptativo em runtime (pressão + estabilidade)."""

from __future__ import annotations

from app.runtime.explosion_control_v2.adaptive_pruning_engine import adaptive_prune_decision


def adaptive_pruning_runtime_bundle(
    *,
    confidence: float,
    token_budget: int,
    tokens_used: int,
    replay_stability: float,
    graph_pressure: float,
) -> dict[str, object]:
    return adaptive_prune_decision(
        confidence=confidence,
        token_budget=token_budget,
        tokens_used=tokens_used,
        replay_stability=replay_stability,
        graph_pressure=graph_pressure,
    )
