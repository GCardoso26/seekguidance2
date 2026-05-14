"""Consistência multiplayer em runtime."""

from __future__ import annotations


def multiplayer_consistency_runtime(conflicts: int) -> float:
    return round(max(0.0, 1.0 - 0.12 * conflicts), 4)
