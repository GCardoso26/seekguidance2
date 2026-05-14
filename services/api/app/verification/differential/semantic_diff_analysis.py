"""Análise semântica de drift entre pipelines."""

from __future__ import annotations

from typing import Any


def classify_semantic_divergence(score: float) -> dict[str, Any]:
    if score <= 0.02:
        risk = "low"
    elif score <= 0.10:
        risk = "medium"
    else:
        risk = "high"
    return {"semantic_divergence": score, "semantic_regression_risk": risk}
