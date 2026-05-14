"""Export de pipeline semântico (spans lógicos)."""

from __future__ import annotations

from typing import Any

from app.observability.runtime_tracing.semantic_trace_spans import SpanNames, semantic_span_tree


def export_semantic_pipeline(phases: list[str]) -> dict[str, Any]:
    return {"root_span": SpanNames.RETRIEVAL, "tree": semantic_span_tree(phases)}
