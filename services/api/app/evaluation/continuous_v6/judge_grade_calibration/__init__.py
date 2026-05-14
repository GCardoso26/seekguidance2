"""Calibração judge-grade."""

from __future__ import annotations

from typing import Any


def judge_grade_calibration_stub(offset: float) -> dict[str, Any]:
    return {"offset": offset, "calibrated": abs(offset) < 0.1}
