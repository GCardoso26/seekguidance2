"""Heurísticas de drift / instabilidade em arestas e trajetos (sem LLM no request path)."""

from __future__ import annotations

import math
from typing import Any


def edge_instability(successes: int, usages: int) -> float:
    if usages <= 0:
        return 0.5
    p = successes / usages
    # Alta instabilidade quando taxa de sucesso é ambígua (≈0.5) ou muito baixa
    return float(1.0 - abs(p - 0.5) * 2.0) * (1.0 - p * 0.35)


def semantic_entropy_from_scores(scores: list[float]) -> float:
    if not scores:
        return 0.0
    t = sum(max(1e-9, s) for s in scores)
    probs = [max(1e-9, s) / t for s in scores]
    return float(-sum(p * math.log(p) for p in probs)) / math.log(len(probs) + 1e-9)


def expansion_anomaly_score(graph_candidates: int, graph_limit: int, final_hits: int) -> float:
    if graph_limit <= 0:
        return 0.0
    fill = graph_candidates / max(1, graph_limit)
    thin = final_hits / max(1, graph_limit)
    if fill > 2.2 and thin < 0.25:
        return 0.85
    if fill > 1.6:
        return 0.45
    return 0.12


def drift_metrics_bundle(
    *,
    graph_edges_used: list[str],
    graph_candidates: int,
    graph_limit: int,
    final_hits: int,
    confidence: float,
    vec_lex_overlap: float | None,
) -> dict[str, Any]:
    dsts = set()
    for lab in graph_edges_used:
        if "->" in lab:
            dsts.add(lab.split("->", 1)[1].split(":", 1)[0])
    low_fanout = len(dsts) <= 1 and len(graph_edges_used) > 4
    return {
        "edge_instability_proxy": edge_instability(int(confidence * 10), 10),
        "semantic_entropy_proxy": semantic_entropy_from_scores([confidence, vec_lex_overlap or 0.0, 0.55]),
        "expansion_anomaly": expansion_anomaly_score(graph_candidates, graph_limit, final_hits),
        "low_value_edge_hint": low_fanout,
    }
