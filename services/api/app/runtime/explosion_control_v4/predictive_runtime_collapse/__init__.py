"""Predição de colapso / explosão."""

from __future__ import annotations


def predictive_explosion_flags(
    *,
    replay_events: int,
    branches: int,
    ontology_terms: int,
    semantic_spread: float,
    temporal_ticks: int,
) -> dict[str, bool]:
    return {
        "replay_explosion": replay_events > 800,
        "branch_explosion": branches > 200,
        "ontology_runaway": ontology_terms > 5000,
        "semantic_divergence": semantic_spread > 0.35,
        "temporal_replay_explosion": temporal_ticks > 10_000,
    }
