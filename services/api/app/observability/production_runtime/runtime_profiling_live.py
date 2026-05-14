"""Profiling live (snapshot de hotspots)."""

from __future__ import annotations

from app.observability.profiling.runtime_hotspots import runtime_hotspot_report


def profiling_live_snapshot() -> dict[str, object]:
    return runtime_hotspot_report(["replay", "graph", "ontology", "retrieval", "branch"])
