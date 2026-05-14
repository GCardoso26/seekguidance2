"""Correlação replay ↔ trace (propagação de lineage lógica)."""

from __future__ import annotations

from typing import Any

from app.observability.tracing_runtime import get_trace_id


def correlate_replay_to_trace(
    replay_id: str,
    *,
    reasoning_version: str | None = None,
) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "trace_id": get_trace_id(),
        "reasoning_version": reasoning_version,
        "correlation": "logical_only",
    }
