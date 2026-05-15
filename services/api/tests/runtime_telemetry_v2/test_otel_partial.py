"""OTEL partial bridge."""

from __future__ import annotations

from app.observability.runtime_exporters import runtime_otel_partial_bridge_stub


def test_otel_partial_shape() -> None:
    p = runtime_otel_partial_bridge_stub("s1")
    assert "telemetry_summary" in p
