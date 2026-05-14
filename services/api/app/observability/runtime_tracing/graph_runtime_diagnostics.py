"""Diagnósticos de runtime do grafo (fanout, pruning)."""

from __future__ import annotations

from typing import Any

from app.graph.explosion_control.caps import graph_pressure_metrics


def graph_runtime_diagnostics(*, considered: int, kept: int) -> dict[str, Any]:
    m = graph_pressure_metrics(considered, kept)
    alerts: list[str] = []
    if m.get("entropy_proxy", 1.0) < 0.25:
        alerts.append("heavy_pruning")
    return {"metrics": m, "alerts": alerts}
