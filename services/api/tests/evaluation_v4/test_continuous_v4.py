"""Continuous evaluation V4."""

from __future__ import annotations

from app.evaluation.continuous_v4 import (
    branch_explosion_accuracy,
    cross_tcg_legality_spread,
    judge_grade_consistency_score,
    multiplayer_consistency_index,
    ontology_drift_regression,
    proof_stability_index,
    replacement_loop_accuracy,
    replay_determinism_index,
    solver_accuracy_stub,
    temporal_regression_flag,
)
from app.evaluation.continuous_v4.human_calibration import disagreement_score


def test_judge_consistency() -> None:
    assert judge_grade_consistency_score(9, 10) == 0.9


def test_cross_tcg() -> None:
    assert cross_tcg_legality_spread({"a": 0.9, "b": 0.5}) == 0.4


def test_temporal_regression() -> None:
    assert temporal_regression_flag("2025-01", "2024-12") is True


def test_solver_accuracy() -> None:
    assert solver_accuracy_stub(8, 10) == 0.8


def test_proof_stability() -> None:
    assert proof_stability_index(True) == 1.0


def test_mp_consistency() -> None:
    assert multiplayer_consistency_index(3) < 1.0


def test_replacement_loop_accuracy() -> None:
    assert replacement_loop_accuracy(True, True) == 1.0


def test_replay_det() -> None:
    assert replay_determinism_index(1, 5) == 1.0


def test_ontology_drift() -> None:
    assert ontology_drift_regression(0.2) is True


def test_branch_explosion_accuracy() -> None:
    assert branch_explosion_accuracy(True, True) == 1.0


def test_disagreement() -> None:
    assert disagreement_score(0.9, 0.7) == 0.2
