"""Pressão de entropia em expansão de grafo (proxy para pruning)."""

from __future__ import annotations


def graph_entropy_pressure(kept: int, considered: int) -> float:
    if considered <= 0:
        return 0.0
    return max(0.0, min(1.0, 1.0 - (kept / considered)))
