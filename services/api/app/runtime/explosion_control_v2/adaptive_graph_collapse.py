"""Colapso adaptativo de expansão de grafo."""

from __future__ import annotations


def adaptive_graph_collapse(kept: int, target: int) -> int:
    if kept <= target:
        return kept
    return max(target, kept // 2)
