"""Agregação de diagnósticos de replay alinhada ao metric/span registry."""

from __future__ import annotations

from typing import Any

from app.observability.runtime_exporters.metric_registry import replay_metric_registry
from app.observability.runtime_exporters.span_registry import otel_span_registry


def replay_diagnostics_aggregation_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "metrics": replay_metric_registry(),
        "spans": otel_span_registry(),
        "assistant_notes": [
            "replay_diagnostics_aggregation: visão única para dashboards.",
        ],
    }
