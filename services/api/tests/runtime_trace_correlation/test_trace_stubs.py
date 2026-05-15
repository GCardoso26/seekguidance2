"""Trace correlation runtime."""
from app.observability.live_runtime.replay_trace_correlation_runtime import (
    replay_trace_correlation_runtime_stub,
)


def test_trace_correlation() -> None:
    p = replay_trace_correlation_runtime_stub("t1")
    assert p["trace_alignment_summary"] is not None
