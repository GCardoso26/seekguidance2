"""Distributed trace correlation v2."""

from __future__ import annotations

from app.observability.runtime_exporters import distributed_trace_correlation_runtime_v2_stub


def test_trace_correlation_v2() -> None:
    p = distributed_trace_correlation_runtime_v2_stub("trace-v3")
    assert p["correlation_score"] > 0
