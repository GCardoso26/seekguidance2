"""Consistência temporal entre versões."""

from __future__ import annotations


def temporal_consistency(drift_score: float) -> float:
    return round(max(0.0, 1.0 - drift_score), 4)
