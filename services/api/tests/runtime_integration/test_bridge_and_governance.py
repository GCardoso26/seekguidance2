"""Integração bridge + governança executável."""

from __future__ import annotations

from app.runtime.replay_governance_v2 import executable_replay_governance_run

from runtime_execution import runtime_execution_bridge_stub


def test_runtime_execution_bridge_wires_governance() -> None:
    b = runtime_execution_bridge_stub("run-1", "replay-a")
    assert "executable_replay_governance" in b
    assert b["executable_replay_governance"]["scores"]["replayability_score"] > 0


def test_executable_governance_deterministic() -> None:
    g = executable_replay_governance_run("r2")
    assert g["scores"]["deterministic_alignment_score"] > 0
