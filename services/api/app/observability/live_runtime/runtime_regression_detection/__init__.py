"""Deteção de regressão de runtime."""

from __future__ import annotations

from typing import Any


def runtime_regression_detection_stub(baseline_p95: float, current_p95: float) -> dict[str, Any]:
    regressed = current_p95 > baseline_p95 * 1.25
    return {
        "baseline_p95_ms": baseline_p95,
        "current_p95_ms": current_p95,
        "regressed": regressed,
        "assistant_notes": ["Regressão de latência pode mascarar timeouts em provas formais."],
    }
