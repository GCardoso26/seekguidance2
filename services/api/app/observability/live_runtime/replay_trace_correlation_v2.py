"""Correlação de traces de replay v2 (OTEL-safe, stub)."""

from __future__ import annotations

from typing import Any


def replay_trace_correlation_v2_stub(scope: str) -> dict[str, Any]:
    return {
        "otel_span_name": "tcg_judge.replay.trace_correlation_v2",
        "scope": scope,
        "assistant_notes": ["replay_trace_correlation_v2: correlação por replay_ref agregado."],
        "metric_family": "replay_trace_correlation_v2",
    }
