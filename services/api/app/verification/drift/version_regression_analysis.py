"""Análise de regressão semântica cross-version."""

from __future__ import annotations

from typing import Any


def regression_risk(version_change_detected: bool, semantic_divergence: float) -> dict[str, Any]:
    risk = 0.03
    if version_change_detected:
        risk += 0.25
    risk += min(0.5, semantic_divergence)
    return {"semantic_regression_risk": round(min(1.0, risk), 4)}
