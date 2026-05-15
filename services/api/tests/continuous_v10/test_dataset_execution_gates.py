"""Ponte continuous v10 ↔ gates."""

from __future__ import annotations

from app.evaluation.continuous_v10 import continuous_v10_dataset_execution_gates_bundle_stub


def test_continuous_v10_gates_bundle() -> None:
    b = continuous_v10_dataset_execution_gates_bundle_stub("run-x")
    assert "gates" in b
    assert "replay_stability" in b["gates"]
