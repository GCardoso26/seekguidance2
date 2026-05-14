"""Integridade de invariantes."""

from __future__ import annotations


def invariant_integrity(violations: int, checks: int) -> float:
    if checks <= 0:
        return 0.0
    return max(0.0, min(1.0, 1.0 - violations / checks))
