"""Trace alignment v2."""

from __future__ import annotations

from app.observability.live_runtime.replay_trace_runtime_v2 import replay_trace_runtime_v2_stub


def test_replay_trace_v2() -> None:
    p = replay_trace_runtime_v2_stub("trace-1")
    assert p["trace_alignment"] is not None
