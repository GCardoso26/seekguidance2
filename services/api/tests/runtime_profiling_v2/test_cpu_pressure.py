"""Runtime profiling v2."""

from __future__ import annotations

from app.observability.live_runtime.runtime_cpu_pressure_runtime import (
    runtime_cpu_pressure_runtime_stub,
)


def test_cpu_pressure() -> None:
    p = runtime_cpu_pressure_runtime_stub("p1")
    assert "cpu_pressure" in p
    assert p["runtime_cost_score"] >= 0
