"""lineage_runtime_metrics — métricas convergentes (stub)."""

from __future__ import annotations

from typing import Any


def lineage_runtime_metrics_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "metric_family": "lineage_runtime_metrics",
        "assistant_notes": ["Naming estável para dashboards; PII-free."],
        "replay_lineage_hint": True,
    }
