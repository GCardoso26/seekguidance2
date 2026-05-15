"""Profiling v3."""

from __future__ import annotations

from app.observability.live_runtime.runtime_operational_profiler_v3 import (
    runtime_operational_profiler_v3_stub,
)


def test_profiler_v3() -> None:
    p = runtime_operational_profiler_v3_stub("prof")
    assert p["runtime_pressure"] >= 0
