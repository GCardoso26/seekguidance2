"""Força de citação (profundidade de encadeamento)."""

from __future__ import annotations


def citation_strength(depth: int) -> float:
    return min(1.0, 0.25 + 0.12 * max(0, depth))
