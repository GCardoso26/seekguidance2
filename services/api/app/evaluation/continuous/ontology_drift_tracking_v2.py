"""Drift de ontologia V2 (derivada + volatilidade)."""

from __future__ import annotations


def ontology_drift_tracking_v2(points: list[float]) -> dict[str, object]:
    if len(points) < 2:
        return {"volatility": 0.0, "trend": "flat"}
    deltas = [abs(points[i] - points[i - 1]) for i in range(1, len(points))]
    vol = sum(deltas) / len(deltas)
    trend = "up" if points[-1] > points[0] + 0.05 else "down" if points[-1] < points[0] - 0.05 else "flat"
    return {"volatility": round(vol, 4), "trend": trend}
