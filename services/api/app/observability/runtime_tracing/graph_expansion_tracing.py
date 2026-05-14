"""Metadados de tracing para expansão de grafo (fanout, profundidade)."""

from __future__ import annotations

from typing import Any

from app.observability.runtime_tracing.semantic_trace_spans import SpanNames
from app.observability.tracing_runtime import get_trace_id


def graph_expansion_span_meta(
    *,
    depth: int,
    fanout: int,
    pruned: int,
) -> dict[str, Any]:
    return {
        "span": SpanNames.GRAPH_EXPAND,
        "trace_id": get_trace_id(),
        "depth": depth,
        "fanout": fanout,
        "pruned": pruned,
    }
