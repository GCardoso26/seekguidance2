"""Métricas de legalidade de cadeia e timing."""

from __future__ import annotations

from typing import Any


def chain_legality_score(formal: dict[str, Any]) -> float:
    if not formal:
        return 0.0
    parts = [
        1.0 if formal.get("precedence_legal") else 0.0,
        1.0 if formal.get("timing_legal") else 0.0,
        1.0 if formal.get("dependency_valid") else 0.0,
    ]
    return sum(parts) / max(1, len(parts))


def ordering_correctness(expected_prefix: list[str], validated_roles: list[str]) -> float:
    if not expected_prefix:
        return 1.0
    if not validated_roles:
        return 0.0
    for i, want in enumerate(expected_prefix):
        if i >= len(validated_roles) or validated_roles[i] != want:
            return i / max(1, len(expected_prefix))
    return 1.0
