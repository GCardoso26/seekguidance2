"""Runtime profiling."""

from __future__ import annotations

from app.observability.live_runtime.runtime_performance_profiler import (
    runtime_performance_profiler_stub,
)


def test_profiler_payload() -> None:
    p = runtime_performance_profiler_stub("p1")
    assert "latency_summary" in p
    assert p["replay_pressure_score"] >= 0
