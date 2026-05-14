"""Desacordo juiz vs modelo."""

from __future__ import annotations


def judge_disagreement_index(expert: float, model: float) -> float:
    return round(abs(expert - model), 4)
