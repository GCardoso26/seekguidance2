"""Métrica de estabilidade de replay."""

from __future__ import annotations


def replay_stability(unique_hashes: int, runs: int) -> float:
    if runs <= 0:
        return 0.0
    return max(0.0, min(1.0, 1.0 - (max(0, unique_hashes - 1) / runs)))
