"""Risco de conflito de interpretação entre juízes."""

from __future__ import annotations


def judge_interpretation_risk(uncertainty: float, divergences: int) -> float:
    return max(0.0, min(1.0, uncertainty + 0.03 * divergences))
