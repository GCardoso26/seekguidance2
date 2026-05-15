"""Runtime gate engine v3."""

from __future__ import annotations

from evaluation.runtime_execution import executable_runtime_gate_engine_v2_stub


def test_gate_engine_v2() -> None:
    p = executable_runtime_gate_engine_v2_stub("run-g3")
    assert p["gate_passed"] is True
