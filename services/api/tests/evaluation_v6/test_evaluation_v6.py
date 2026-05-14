"""Continuous evaluation v6."""

from __future__ import annotations

import json
from pathlib import Path

from app.evaluation.continuous_v6 import (
    cross_tcg_consistency_tracking_stub,
    cross_tcg_regression_matrix_stub,
    cross_version_drift_analysis_stub,
    cross_version_regression_tracking_stub,
    deterministic_runtime_scoring_stub,
    human_disagreement_analysis_stub,
    judge_grade_calibration_stub,
    legality_trend_stub,
    ontology_drift_timeline_stub,
    ontology_instability_tracking_stub,
    replay_consistency_regressions_stub,
    replay_divergence_analytics_stub,
    replay_stability_history_stub,
    runtime_regression_history_stub,
    semantic_divergence_tracking_stub,
    semantic_instability_tracking_stub,
    solver_accuracy_tracking_v6_stub,
    solver_confidence_evolution_stub,
    temporal_legality_tracking_stub,
)


def test_legality_trend() -> None:
    assert legality_trend_stub([0.0, 0.5])["trend"] == "up"


def test_replay_stability_history() -> None:
    assert replay_stability_history_stub([True, False])["stable_ratio"] == 0.5


def test_cross_version_regression() -> None:
    assert cross_version_regression_tracking_stub(1.0, 0.5)["regressed"] is True


def test_judge_grade_dataset_manifest() -> None:
    root = Path(__file__).resolve().parents[2] / "evaluation" / "judge_grade_datasets_v2"
    manifest = json.loads((root / "manifests" / "stub_manifest.json").read_text(encoding="utf-8"))
    assert manifest["dataset_id"]
    lineage = json.loads((root / "lineage" / "example_lineage.json").read_text(encoding="utf-8"))
    assert lineage["ruling_id"]


def test_ontology_drift_timeline() -> None:
    assert ontology_drift_timeline_stub([0.1, 0.3])["max_drift"] == 0.3


def test_cross_tcg_soft() -> None:
    assert "assistant_notes" in cross_tcg_consistency_tracking_stub(0.4)


def test_human_disagreement() -> None:
    assert human_disagreement_analysis_stub(1, 4)["rate"] == 0.25


def test_judge_grade_calibration() -> None:
    assert judge_grade_calibration_stub(0.01)["calibrated"] is True


def test_replay_divergence() -> None:
    assert replay_divergence_analytics_stub({"a", "b"})["divergent"] is True


def test_semantic_instability() -> None:
    assert semantic_instability_tracking_stub([True, True])["unstable_ratio"] == 1.0


def test_solver_confidence() -> None:
    assert solver_confidence_evolution_stub([0.2, 0.9])["last"] == 0.9


def test_runtime_regression_history() -> None:
    assert runtime_regression_history_stub([1.0, 0.9])["points"] == 2


def test_cross_version_drift() -> None:
    assert cross_version_drift_analysis_stub(1.0, 0.5)["alert"] is True


def test_solver_accuracy_v6() -> None:
    assert solver_accuracy_tracking_v6_stub(8, 10)["accuracy"] == 0.8


def test_replay_consistency_regressions() -> None:
    assert replay_consistency_regressions_stub([True, False])["failure_rate"] == 0.5


def test_temporal_legality() -> None:
    assert temporal_legality_tracking_stub(["legal", "illegal"])["degraded"] is True


def test_cross_tcg_matrix() -> None:
    m = cross_tcg_regression_matrix_stub({("mtg", "yugioh"): 0.05})
    assert "mtg|yugioh" in m["cells"]


def test_semantic_divergence_tracking() -> None:
    assert semantic_divergence_tracking_stub([0.1, 0.4])["max"] == 0.4


def test_ontology_instability() -> None:
    assert ontology_instability_tracking_stub(4)["unstable"] is True


def test_deterministic_runtime_scoring() -> None:
    assert deterministic_runtime_scoring_stub(3, 3)["score"] == 1.0
