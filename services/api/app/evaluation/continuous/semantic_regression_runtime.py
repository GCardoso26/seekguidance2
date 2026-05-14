"""Regressão semântica em runtime (agrega métricas existentes)."""

from __future__ import annotations

from typing import Any


def semantic_regression_snapshot(*, drift_score: float, threshold: float = 0.25) -> dict[str, Any]:
    return {"regression": drift_score > threshold, "drift_score": drift_score}
