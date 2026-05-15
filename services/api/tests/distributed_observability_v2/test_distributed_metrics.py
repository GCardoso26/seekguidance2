"""Observabilidade distribuída v2."""

from __future__ import annotations

from app.observability.live_runtime import replay_trace_correlation_v2_stub
from app.observability.runtime_exporters import distributed_replay_otel_exporter_stub


def test_distributed_observability() -> None:
    m = replay_trace_correlation_v2_stub("s")
    assert "otel_span_name" in m
    e = distributed_replay_otel_exporter_stub("s")
    assert "prometheus_prefix" in e
