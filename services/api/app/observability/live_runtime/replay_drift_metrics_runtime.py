"""replay_drift_metrics_runtime"""

from __future__ import annotations

from typing import Any


def replay_drift_metrics_runtime_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "otel_scope": "tcg_judge.replay_drift_metrics_runtime",
        "assistant_notes": ["replay_drift_metrics_runtime_stub: execução operacional; explainability-first."],
        "telemetry_summary": {},
        "trace_alignment": {},
        "replay_trace_hints": {},
        "operational_sampling_notes": [],
    }
