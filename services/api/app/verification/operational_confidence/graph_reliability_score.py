"""Confiabilidade do grafo (pruning + pressão)."""

from __future__ import annotations


def graph_reliability_score(*, kept_ratio: float, pressure: float) -> float:
    kr = max(0.0, min(1.0, kept_ratio))
    pr = max(0.0, min(1.0, pressure))
    return round(max(0.0, min(1.0, 0.7 * kr + 0.3 * (1.0 - pr))), 4)
