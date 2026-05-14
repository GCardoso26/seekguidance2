"""Tracking de legalidade em runtime."""

from __future__ import annotations


def runtime_legality_score(ok_runs: int, total: int) -> float:
    return round(ok_runs / max(1, total), 4)
