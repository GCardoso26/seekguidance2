"""Ponte de convergência entre exportadores e métricas live (stub)."""

from __future__ import annotations

from typing import Any

from app.observability.live_runtime.replay_runtime_metrics_bridge import replay_runtime_metrics_bridge_stub
from app.observability.runtime_exporters.prometheus_runtime_exporter import prometheus_runtime_exporter_stub


def metrics_convergence_bridge_stub(scope: str) -> dict[str, Any]:
    live = replay_runtime_metrics_bridge_stub(scope)
    prom = prometheus_runtime_exporter_stub(scope)
    return {
        "scope": scope,
        "assistant_notes": [
            "Convergência incremental live ↔ exporters; dashboards partilham famílias de métricas.",
        ],
        "live": live,
        "prometheus": prom,
    }
