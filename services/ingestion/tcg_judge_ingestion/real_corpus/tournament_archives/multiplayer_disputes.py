"""Disputas multiplayer em arquivo (severidade operacional, não penalidade)."""

from __future__ import annotations


def dispute_severity(*, players_involved: int, simultaneous: bool) -> str:
    if players_involved >= 4 and simultaneous:
        return "high"
    if players_involved >= 2:
        return "medium"
    return "low"
