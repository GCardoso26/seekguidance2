"""Métricas gerais de correctness."""

from __future__ import annotations


def runtime_correctness(pass_count: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return max(0.0, min(1.0, pass_count / total))
