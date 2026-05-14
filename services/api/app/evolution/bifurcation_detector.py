"""Detector de bifurcação semântica."""

from __future__ import annotations


def bifurcation_detected(divergence_score: float, branch_count: int) -> bool:
    return divergence_score >= 0.15 or branch_count > 1
