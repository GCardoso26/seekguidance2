"""Bundle de correlação retrieval → reasoning (diagnóstico de regressão semântica)."""

from __future__ import annotations

from typing import Any

from app.observability.runtime_tracing.semantic_trace_spans import SpanNames
from app.observability.tracing_runtime import get_trace_id


def pipeline_correlation_bundle(
    *,
    retrieval_ms: float,
    reasoning_ms: float,
    doc_hits: int,
) -> dict[str, Any]:
    return {
        "trace_id": get_trace_id(),
        "retrieval_span": SpanNames.RETRIEVAL,
        "reasoning_span": SpanNames.REASONING,
        "retrieval_ms": retrieval_ms,
        "reasoning_ms": reasoning_ms,
        "doc_hits": doc_hits,
        "latency_ratio": round(reasoning_ms / max(0.001, retrieval_ms), 4),
    }
