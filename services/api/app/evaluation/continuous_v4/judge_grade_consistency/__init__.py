"""Consistência judge-grade."""

from __future__ import annotations


def judge_grade_consistency_score(samples_ok: int, samples_total: int) -> float:
    if samples_total <= 0:
        return 1.0
    return round(samples_ok / samples_total, 4)
