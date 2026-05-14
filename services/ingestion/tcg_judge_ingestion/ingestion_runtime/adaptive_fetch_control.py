"""Controlo adaptativo de fetch (delay em segundos)."""

from __future__ import annotations


def adaptive_fetch_delay(failures: int, *, base_s: float = 0.5, max_s: float = 30.0) -> float:
    return min(max_s, base_s * (2**min(failures, 6)))
