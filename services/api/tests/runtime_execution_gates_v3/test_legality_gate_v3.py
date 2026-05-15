"""Gates v3."""

from __future__ import annotations

from evaluation.runtime_execution import legality_runtime_gate_v3_stub


def test_legality_gate_v3() -> None:
    p = legality_runtime_gate_v3_stub("gate-v3")
    assert p["gate_passed"] is True
