"""Tracking de drift de ontologia (série reduzida)."""

from __future__ import annotations

from typing import Any


def ontology_drift_series(points: list[float]) -> dict[str, Any]:
    if len(points) < 2:
        return {"trend": "flat", "delta": 0.0}
    delta = points[-1] - points[0]
    trend = "up" if delta > 0.05 else "down" if delta < -0.05 else "flat"
    return {"trend": trend, "delta": round(delta, 4)}
