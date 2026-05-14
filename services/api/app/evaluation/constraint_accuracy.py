"""Precisão de constraints vs expectativas de dataset."""

from __future__ import annotations

from typing import Any


def constraint_expectation_recall(
    expected: list[str],
    violations: list[dict[str, Any]],
) -> float:
    if not expected:
        return 1.0
    vtypes = {v.get("type", "") for v in violations}
    hits = sum(1 for e in expected if e in vtypes)
    return hits / max(1, len(expected))


def constraint_satisfaction_score(formal: dict[str, Any]) -> float:
    if not formal:
        return 0.0
    return float(formal.get("validation_score", 0.0))
