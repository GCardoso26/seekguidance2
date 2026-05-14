"""Motor de pruning adaptativo (confidence, budget, pressão)."""

from __future__ import annotations

from typing import Any


def adaptive_prune_decision(
    *,
    confidence: float,
    token_budget: int,
    tokens_used: int,
    replay_stability: float,
    graph_pressure: float,
) -> dict[str, Any]:
    over_budget = tokens_used > token_budget
    low_conf = confidence < 0.55
    unstable = replay_stability < 0.7
    hot_graph = graph_pressure > 0.85
    prune = over_budget or low_conf or unstable or hot_graph
    return {
        "prune": prune,
        "reasons": {
            "over_budget": over_budget,
            "low_confidence": low_conf,
            "unstable_replay": unstable,
            "hot_graph": hot_graph,
        },
    }
