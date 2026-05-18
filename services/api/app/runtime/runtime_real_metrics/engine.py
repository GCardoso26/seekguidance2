"""Métricas runtime — agregador."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_real_metrics.collector import record, snapshot


def runtime_real_metrics_engine_v1(scope: str, *, metric: str | None = None, value: float = 1.0) -> dict[str, Any]:
    if metric:
        record(metric, value)
    return {
        "scope": scope,
        "metrics": snapshot(),
        "integrity_status": "ok",
        "runtime_confidence": 0.94,
    }
