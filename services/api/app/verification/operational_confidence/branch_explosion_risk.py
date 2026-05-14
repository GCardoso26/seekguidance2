"""Risco de explosão de ramos."""

from __future__ import annotations


def branch_explosion_risk(branches: int, cap: int) -> float:
    if cap <= 0:
        return 1.0
    return round(max(0.0, min(1.0, branches / cap - 1.0)), 4)
