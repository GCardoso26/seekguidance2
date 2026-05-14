"""Métricas de deteção de contradições (adversarial)."""

from __future__ import annotations

from typing import Any


def contradiction_detection_rate(
    expected_contradiction: bool,
    detected: list[dict[str, Any]],
) -> float:
    has = len(detected) > 0
    if expected_contradiction:
        return 1.0 if has else 0.0
    return 1.0 if not has else 0.0


def critical_contradiction_count(detected: list[dict[str, Any]]) -> int:
    return sum(1 for d in detected if d.get("severity") == "critical")
