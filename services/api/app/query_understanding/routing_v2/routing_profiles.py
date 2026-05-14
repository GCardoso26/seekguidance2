"""Perfil de routing V2: pesos híbridos, expansão e agressividade de rerank."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RoutingStrategyV2:
    profile_name: str
    reasoning_graph_template: str
    vector_weight: float
    lexical_weight: float
    rrf_blend: float
    graph_expansion_scale: float
    rerank_pool_scale: float
    edge_min_relationship_score: float | None
    reasoning_path_labels: tuple[str, ...]


def normalize_hybrid_weights(vector_w: float, lexical_w: float) -> tuple[float, float]:
    s = max(1e-6, vector_w + lexical_w)
    return vector_w / s, lexical_w / s
