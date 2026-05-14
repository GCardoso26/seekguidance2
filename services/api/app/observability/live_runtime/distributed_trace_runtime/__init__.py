"""Tracing distribuído em runtime (OTEL-friendly, stub)."""

from __future__ import annotations

from typing import Any


def distributed_trace_runtime_stub(trace_id: str, spans: int) -> dict[str, Any]:
    return {
        "trace_id": trace_id,
        "spans": spans,
        "assistant_notes": ["Correlacionar span de replay com span de solver no collector."],
    }
