"""Controlo de explosão em expansão de grafo (caps + métricas de pressão)."""

from __future__ import annotations

from typing import Any

from app.core.config import Settings


def adaptive_depth_cap(settings: Settings, *, query_complexity: float) -> int:
    base = settings.graph_expansion_max
    qc = max(0.0, min(1.0, query_complexity))
    scaled = int(base * (0.75 + 0.25 * qc))
    return max(settings.graph_expansion_min, min(base, scaled))


def semantic_fanout_cap(settings: Settings, *, seed_count: int) -> int:
    cap = max(4, settings.graph_retrieval_extra_limit + seed_count * 2)
    return min(settings.graph_expansion_max, cap)


def graph_pressure_metrics(n_edges_considered: int, n_kept: int) -> dict[str, Any]:
    pruned = max(0, n_edges_considered - n_kept)
    return {
        "edges_considered": n_edges_considered,
        "edges_kept": n_kept,
        "pruned": pruned,
        "entropy_proxy": round(n_kept / max(1, n_edges_considered), 4),
    }


def confidence_aware_prune(score: float, threshold: float = 0.82) -> bool:
    return score < threshold
