"""Spans lógicos do pipeline simbólico (sem alterar reasoning_v1–v11)."""

from __future__ import annotations

from typing import Any

from app.observability.runtime_tracing.semantic_trace_spans import SpanNames
from app.observability.tracing_runtime import get_trace_id


def symbolic_pipeline_span_meta(*, branch_estimate: int, cap: int) -> dict[str, Any]:
    return {
        "span": SpanNames.SYMBOLIC_SIM,
        "trace_id": get_trace_id(),
        "branch_estimate": branch_estimate,
        "cap": cap,
        "pressure": min(1.0, branch_estimate / max(1, cap)),
    }
