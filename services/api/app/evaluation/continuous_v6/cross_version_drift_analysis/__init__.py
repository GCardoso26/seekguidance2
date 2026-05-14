"""Drift cross-version."""

from __future__ import annotations

from typing import Any


def cross_version_drift_analysis_stub(v1: float, v2: float) -> dict[str, Any]:
    return {"delta": v2 - v1, "alert": abs(v2 - v1) > 0.2}
