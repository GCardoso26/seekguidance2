"""Predição leve de divergência semântica (não é embedding real)."""

from __future__ import annotations


def semantic_divergence_prediction(score_a: float, score_b: float) -> float:
    return round(abs(score_a - score_b), 4)
