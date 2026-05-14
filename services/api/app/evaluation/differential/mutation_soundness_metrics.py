"""Soundness de mutações."""

from __future__ import annotations


def mutation_soundness(valid_mutations: int, total_mutations: int) -> float:
    if total_mutations <= 0:
        return 1.0
    return max(0.0, min(1.0, valid_mutations / total_mutations))
