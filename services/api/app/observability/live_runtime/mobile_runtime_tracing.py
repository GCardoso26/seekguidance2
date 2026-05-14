"""Tracing leve do runtime móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_tracing_stub(trace_id: str) -> dict[str, Any]:
    return {
        "trace_id": trace_id,
        "assistant_notes": ["Tracing local em ring buffer; export cloud opcional."],
        "replay_summary": {"spans": 2},
        "deterministic_alignment": {"span_order": "fifo"},
        "lineage_replay_awareness": {"slice": "mrt-v2"},
    }
