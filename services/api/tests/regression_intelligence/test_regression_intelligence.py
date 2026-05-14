"""Regression intelligence (continuous v6)."""

from __future__ import annotations

from app.evaluation.continuous_v6 import (
    cross_tcg_regression_matrix_stub,
    cross_version_drift_analysis_stub,
    deterministic_runtime_scoring_stub,
    replay_consistency_regressions_stub,
    runtime_regression_history_stub,
    semantic_divergence_tracking_stub,
)


def test_runtime_regression_history_intel() -> None:
    assert runtime_regression_history_stub([1.0, 1.1])["last"] == 1.1


def test_cross_version_drift_intel() -> None:
    assert cross_version_drift_analysis_stub(1.0, 1.5)["delta"] == 0.5


def test_replay_consistency_regressions_intel() -> None:
    assert replay_consistency_regressions_stub([False])["failure_rate"] == 1.0


def test_semantic_divergence_intel() -> None:
    assert semantic_divergence_tracking_stub([0.0, 0.2])["max"] == 0.2


def test_deterministic_scoring_intel() -> None:
    assert deterministic_runtime_scoring_stub(2, 4)["score"] == 0.5


def test_cross_tcg_matrix_intel() -> None:
    m = cross_tcg_regression_matrix_stub({("pokemon", "digimon"): 0.3})
    assert "pokemon|digimon" in m["cells"]
