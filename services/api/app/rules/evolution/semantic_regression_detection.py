"""Detecção de regressão semântica."""

from __future__ import annotations


def runtime_semantic_stability(score: float) -> float:
    return round(max(0.0, min(1.0, 1.0 - score * 0.1)), 4)
