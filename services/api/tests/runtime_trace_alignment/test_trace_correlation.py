"""Trace correlation v2."""

from __future__ import annotations

from app.observability.live_runtime import distributed_replay_trace_correlation_v2_stub


def test_trace_correlation() -> None:
    t = distributed_replay_trace_correlation_v2_stub("t1")
    assert isinstance(t, dict)
