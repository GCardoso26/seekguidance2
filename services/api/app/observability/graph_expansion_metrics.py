"""Métricas de expansão de grafo."""

from __future__ import annotations

from typing import Any

_GRAPH: dict[str, int] = {}


def record_graph_metric(name: str, value: int) -> None:
    _GRAPH[name] = value


def graph_metrics_snapshot() -> dict[str, Any]:
    return {"graph": dict(_GRAPH)}
