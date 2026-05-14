"""Confiança semântica derivada de sinais de parser / hits."""

from __future__ import annotations


def semantic_confidence(hit_count: int, *, baseline: int = 4) -> float:
    if hit_count <= 0:
        return 0.2
    return min(1.0, 0.35 + 0.15 * min(hit_count, baseline))
