"""Métricas de estabilidade do runtime."""

from __future__ import annotations


def stability_score(steps: int, errors: int) -> float:
    if steps <= 0:
        return 0.0
    return max(0.0, min(1.0, 1.0 - errors / max(1, steps)))
