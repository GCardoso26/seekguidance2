"""Score de soundness de runtime."""

from __future__ import annotations


def runtime_soundness_score(*, failures: int, checks: int) -> float:
    if checks <= 0:
        return 0.0
    return max(0.0, min(1.0, 1.0 - failures / checks))
