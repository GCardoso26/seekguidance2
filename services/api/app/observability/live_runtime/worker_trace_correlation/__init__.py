"""Correlação de traces entre workers."""

from __future__ import annotations

from typing import Any


def worker_trace_correlation_stub(worker_ids: list[str]) -> dict[str, Any]:
    return {
        "workers": worker_ids,
        "correlation_key": "w3c_traceparent_compatible_stub",
        "assistant_notes": ["Útil para pruning distribuído e DLQ inspection."],
    }
