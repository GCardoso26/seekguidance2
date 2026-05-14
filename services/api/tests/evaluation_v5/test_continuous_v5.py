"""Continuous evaluation V5."""

from __future__ import annotations

from app.evaluation.continuous_v5 import (
    continuous_regression_bundle,
    cross_tcg_runtime_spread,
    expert_review_hook_stub,
    historical_regression_stub,
    judge_disagreement_index,
    multiplayer_consistency_runtime,
    proof_stability_runtime,
    replay_determinism_runtime,
    runtime_legality_score,
    semantic_drift_runtime,
    solver_accuracy_runtime,
)


def test_runtime_legality() -> None:
    assert runtime_legality_score(8, 10) == 0.8


def test_solver_accuracy_rt() -> None:
    assert solver_accuracy_runtime(9, 10) == 0.9


def test_cross_tcg_rt() -> None:
    assert cross_tcg_runtime_spread({"a": 1.0, "b": 0.0}) == 1.0


def test_historical_regr() -> None:
    assert historical_regression_stub(0.05) is False


def test_semantic_drift_rt() -> None:
    assert semantic_drift_runtime(0.5)["drift"] is True


def test_replay_det_rt() -> None:
    assert replay_determinism_runtime(1) == 1.0


def test_judge_disagreement() -> None:
    assert judge_disagreement_index(0.9, 0.7) == 0.2


def test_proof_stability_rt() -> None:
    assert proof_stability_runtime(True) == 1.0


def test_mp_consistency_rt() -> None:
    assert multiplayer_consistency_runtime(2) < 1.0


def test_expert_hook() -> None:
    assert expert_review_hook_stub("c1")["status"] == "pending_expert"


def test_continuous_bundle() -> None:
    b = continuous_regression_bundle(a=1, b=2)
    assert "a" in b["tracks"]
