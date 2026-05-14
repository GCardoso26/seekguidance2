"""Explosion control v5."""

from __future__ import annotations

from app.runtime.explosion_control_v5 import (
    predictive_branch_collapse_stub,
    replay_compaction_runtime_stub,
    runtime_emergency_stabilization_stub,
    semantic_divergence_prediction_stub,
)


def test_predictive_collapse() -> None:
    assert predictive_branch_collapse_stub(100, cap=10)["collapsed"] == 90


def test_semantic_divergence() -> None:
    assert semantic_divergence_prediction_stub(0.9)["divergence_prediction"] is True


def test_replay_compaction() -> None:
    assert replay_compaction_runtime_stub(20, target=5)["replay_compression_diagnostics"]["removed"] == 15


def test_emergency() -> None:
    assert runtime_emergency_stabilization_stub(True)["convergence_confidence"] == 0.5
