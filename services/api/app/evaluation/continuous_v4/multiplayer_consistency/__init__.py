"""Consistência multiplayer."""

from __future__ import annotations


def multiplayer_consistency_index(conflicts: int) -> float:
    return round(max(0.0, 1.0 - 0.1 * conflicts), 4)
