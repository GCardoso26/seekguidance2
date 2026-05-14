"""Calibração humana (hooks)."""

from __future__ import annotations


def disagreement_score(expert: float, model: float) -> float:
    return round(abs(expert - model), 4)
