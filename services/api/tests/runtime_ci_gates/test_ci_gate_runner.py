"""CI gate runners."""

from __future__ import annotations

from evaluation.runtime_execution import runtime_ci_gate_runner_stub


def test_ci_gate_payload() -> None:
    p = runtime_ci_gate_runner_stub("run-a")
    assert p["runtime_confidence"] > 0
    assert "legality_summary" in p
