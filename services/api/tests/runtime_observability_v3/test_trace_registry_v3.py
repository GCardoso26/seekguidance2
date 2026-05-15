"""Observability v3."""

from __future__ import annotations

from app.observability.runtime_exporters import runtime_trace_registry_v3_stub


def test_trace_registry_v3() -> None:
    p = runtime_trace_registry_v3_stub("tr")
    assert p["correlation_score"] > 0
