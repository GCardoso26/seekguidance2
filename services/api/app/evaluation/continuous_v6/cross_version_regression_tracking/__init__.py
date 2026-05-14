"""Regressão cross-version."""

from __future__ import annotations

from typing import Any


def cross_version_regression_tracking_stub(v1_score: float, v2_score: float) -> dict[str, Any]:
    return {"regressed": v2_score < v1_score - 0.05, "v1": v1_score, "v2": v2_score}
