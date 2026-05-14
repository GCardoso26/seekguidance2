"""Similaridade entre lineages."""

from __future__ import annotations


def lineage_similarity(a: list[str], b: list[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 1.0
    return round(len(sa & sb) / max(1, len(sa | sb)), 4)
