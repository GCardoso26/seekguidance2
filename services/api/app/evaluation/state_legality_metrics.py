"""Métricas de legalidade de estado simbólico."""

from __future__ import annotations

from typing import Any


def state_legality_accuracy(expected: bool, actual: dict[str, Any] | None) -> float:
    if actual is None:
        return 0.0
    ok = bool(actual.get("state_legality"))
    return 1.0 if ok == expected else 0.0
