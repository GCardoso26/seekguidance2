"""replay_runtime_metrics_bridge — métricas convergentes (stub)."""

from __future__ import annotations

from typing import Any


def replay_runtime_metrics_bridge_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "metric_family": "replay_runtime_metrics_bridge",
        "assistant_notes": ["Naming estável para dashboards; PII-free."],
        "replay_lineage_hint": True,
    }
