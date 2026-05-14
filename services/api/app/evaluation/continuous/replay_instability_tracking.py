"""Tracking de instabilidade de replay."""

from __future__ import annotations


def replay_instability_index(run_variance: float) -> float:
    return round(max(0.0, min(1.0, run_variance)), 4)
