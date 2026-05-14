"""Determinismo de replay."""

from __future__ import annotations


def replay_determinism_index(hashes_unique: int, runs: int) -> float:
    if runs <= 0:
        return 1.0
    return round(1.0 if hashes_unique == 1 else 0.0, 4)
