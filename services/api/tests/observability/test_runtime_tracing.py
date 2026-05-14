"""Runtime tracing package."""

from __future__ import annotations

from app.observability.runtime_tracing import (
    correlate_replay_to_trace,
    graph_expansion_span_meta,
    pipeline_correlation_bundle,
    semantic_span_tree,
)
from app.observability.tracing_runtime import bind_trace, reset_trace


def test_correlation_and_pipeline() -> None:
    tok = bind_trace("t-1")
    try:
        c = correlate_replay_to_trace("r1", reasoning_version="v9")
        assert c["replay_id"] == "r1"
        p = pipeline_correlation_bundle(retrieval_ms=10.0, reasoning_ms=40.0, doc_hits=3)
        assert p["latency_ratio"] == 4.0
        g = graph_expansion_span_meta(depth=2, fanout=5, pruned=1)
        assert g["fanout"] == 5
        tree = semantic_span_tree(["rerank", "reasoning"])
        assert "phases" in tree
    finally:
        reset_trace(tok)


def test_graph_expansion_meta_trace() -> None:
    tok = bind_trace("t-2")
    try:
        m = graph_expansion_span_meta(depth=1, fanout=2, pruned=0)
        assert m["trace_id"] == "t-2"
    finally:
        reset_trace(tok)
