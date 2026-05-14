"""Explosion control v5."""

from __future__ import annotations

from app.runtime.explosion_control_v5 import (
    mobile_branch_caps_stub,
    mobile_entropy_limits_stub,
    mobile_replay_compaction_stub,
    mobile_safe_pruning_stub,
    predictive_branch_collapse_stub,
    replay_compaction_runtime_stub,
    runtime_emergency_stabilization_stub,
    semantic_divergence_prediction_stub,
)


def test_mobile_safe_pruning() -> None:
    out = mobile_safe_pruning_stub(40, device_mem_mb=2048)
    assert out["cap"] == 8


def test_mobile_entropy_limits() -> None:
    out = mobile_entropy_limits_stub(0.5, mem_mb=2048)
    assert out["clamped"] is True


def test_mobile_branch_caps() -> None:
    assert mobile_branch_caps_stub(30)["pruned"] == 18


def test_mobile_replay_compaction() -> None:
    assert mobile_replay_compaction_stub(30, 10)["removed"] == 20


def test_predictive_collapse() -> None:
    assert predictive_branch_collapse_stub(100, cap=10)["collapsed"] == 90


def test_semantic_divergence() -> None:
    assert semantic_divergence_prediction_stub(0.9)["divergence_prediction"] is True


def test_replay_compaction() -> None:
    assert replay_compaction_runtime_stub(20, target=5)["replay_compression_diagnostics"]["removed"] == 15


def test_emergency() -> None:
    assert runtime_emergency_stabilization_stub(True)["convergence_confidence"] == 0.5
