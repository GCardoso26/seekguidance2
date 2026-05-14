"""Integridade do log de mutações."""

from __future__ import annotations


def mutation_integrity_ratio(valid: int, total: int) -> float:
    if total <= 0:
        return 1.0
    return valid / total
