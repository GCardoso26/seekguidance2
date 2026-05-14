"""Similaridade semântica de grafos."""

from __future__ import annotations


def semantic_similarity(a_nodes: list[str], b_nodes: list[str]) -> float:
    sa, sb = set(a_nodes), set(b_nodes)
    if not sa and not sb:
        return 1.0
    inter = len(sa & sb)
    union = max(1, len(sa | sb))
    return round(inter / union, 4)
