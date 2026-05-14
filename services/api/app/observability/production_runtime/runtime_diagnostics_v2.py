"""Diagnósticos runtime V2 (replay + grafo + divergência)."""

from __future__ import annotations

from typing import Any

from app.observability.runtime_tracing.graph_runtime_diagnostics import graph_runtime_diagnostics
from app.observability.runtime_tracing.replay_diagnostics import replay_diagnostics_bundle


def runtime_diagnostics_bundle(
    events_a: list[dict[str, Any]],
    events_b: list[dict[str, Any]],
    *,
    graph_considered: int,
    graph_kept: int,
) -> dict[str, Any]:
    return {
        "replay": replay_diagnostics_bundle(events_a, events_b),
        "graph": graph_runtime_diagnostics(considered=graph_considered, kept=graph_kept),
    }
