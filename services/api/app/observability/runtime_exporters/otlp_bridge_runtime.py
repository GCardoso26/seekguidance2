"""otlp_bridge_runtime"""

from __future__ import annotations

from typing import Any


def otlp_bridge_runtime_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "otel_scope": "tcg_judge.otlp_bridge_runtime",
        "prometheus_prefix": "tcg_judge_otlp_bridge_runtime",
        "assistant_notes": ["otlp_bridge_runtime_stub: execução operacional; explainability-first."],
        "metrics_runtime_summary": {},
        "trace_alignment_summary": {},
        "replay_health_metrics": {"nominal": True},
        "federation_runtime_metrics": {},
        "lineage_runtime_metrics": {},
        "replay_lineage_trace_hint": True,
    }
