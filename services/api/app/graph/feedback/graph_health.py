"""Agregados simples de saúde do grafo a partir de telemetria recente."""

from __future__ import annotations

from typing import Any


def graph_health_summary(
    *,
    mean_reinforcement: float | None,
    noise_ratio: float | None,
    traversal_efficiency: float | None,
) -> dict[str, Any]:
    return {
        "edge_quality_mean": round(mean_reinforcement or 0.0, 4),
        "graph_noise_ratio": round(noise_ratio or 0.0, 4),
        "traversal_efficiency": round(traversal_efficiency or 0.0, 4),
        "reasoning_quality_hint": "stable" if (mean_reinforcement or 0) > 0.52 else "watch",
    }


def estimate_noise_ratio(confidence: float, graph_candidates: int, token_efficiency: float) -> float:
    return max(
        0.0,
        min(
            1.0,
            (1.0 - confidence) * 0.45 + max(0.0, graph_candidates - 18) * 0.012 + (1.0 - token_efficiency) * 0.25,
        ),
    )


def estimate_traversal_efficiency(final_hits: int, graph_candidates: int) -> float:
    if graph_candidates <= 0:
        return 1.0
    return max(0.0, min(1.0, final_hits / max(1, graph_candidates)))
