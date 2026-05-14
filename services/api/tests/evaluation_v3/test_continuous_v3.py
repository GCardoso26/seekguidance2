"""Continuous evaluation V3."""

from __future__ import annotations

from app.evaluation.continuous import (
    branch_explosion_tracking,
    cross_tcg_regression_tracking,
    legality_stability_series,
    ontology_drift_tracking_v2,
    replay_divergence_tracking,
    semantic_consistency_tracking,
)


def test_legality_series() -> None:
    assert legality_stability_series([True, True, False])["stable"] is False


def test_replay_div() -> None:
    assert replay_divergence_tracking(["a", "b"])["divergence"] is True


def test_cross_tcg_reg() -> None:
    assert cross_tcg_regression_tracking({"x": 0.9, "y": 0.5})["regression_signal"] is True


def test_ontology_v2() -> None:
    r = ontology_drift_tracking_v2([0.1, 0.2, 0.35])
    assert r["trend"] == "up"


def test_branch_explosion() -> None:
    assert branch_explosion_tracking(100, 10)["over_cap"] is True


def test_semantic_consistency() -> None:
    assert semantic_consistency_tracking([0.9, 0.95, 0.92])["ok"] is True
