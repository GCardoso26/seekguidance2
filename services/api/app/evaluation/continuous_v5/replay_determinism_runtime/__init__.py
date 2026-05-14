"""Determinismo de replay em runtime."""

from __future__ import annotations


def replay_determinism_runtime(unique_hashes: int) -> float:
    return 1.0 if unique_hashes == 1 else 0.0
