"""Métrica de drift semântico."""

from __future__ import annotations


def semantic_drift_score(divergence: float) -> float:
    return max(0.0, min(1.0, divergence))
