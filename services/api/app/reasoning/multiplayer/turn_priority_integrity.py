"""Integridade de prioridade de turno (monótono por tick)."""

from __future__ import annotations


def turn_priority_ok(turn_ticks: list[int]) -> bool:
    return all(turn_ticks[i] <= turn_ticks[i + 1] for i in range(len(turn_ticks) - 1)) if turn_ticks else True
