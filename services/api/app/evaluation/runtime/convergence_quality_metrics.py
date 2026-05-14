"""Qualidade de convergência."""

from __future__ import annotations


def convergence_quality(branches_pruned: int, branches_total: int) -> float:
    if branches_total <= 0:
        return 1.0
    return max(0.0, min(1.0, branches_pruned / branches_total))
