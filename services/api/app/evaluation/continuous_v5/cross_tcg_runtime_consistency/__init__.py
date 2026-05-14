"""Consistência cross-TCG em runtime."""

from __future__ import annotations


def cross_tcg_runtime_spread(scores: dict[str, float]) -> float:
    vals = sorted(scores.values())
    if len(vals) < 2:
        return 0.0
    return round(vals[-1] - vals[0], 4)
