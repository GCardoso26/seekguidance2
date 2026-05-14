"""Análise de fork de gameplay."""

from __future__ import annotations


def gameplay_behavior_change(divergence_score: float) -> bool:
    return divergence_score >= 0.12
