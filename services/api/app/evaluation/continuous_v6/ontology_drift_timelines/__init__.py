"""Timelines de drift de ontologia."""

from __future__ import annotations

from typing import Any


def ontology_drift_timeline_stub(points: list[float]) -> dict[str, Any]:
    return {"points": points, "max_drift": max(points) if points else 0.0}
