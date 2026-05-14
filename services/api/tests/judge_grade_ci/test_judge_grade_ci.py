"""Judge-grade CI (evaluation package)."""

from __future__ import annotations

from judge_grade_datasets_v2 import (
    ci_evaluation_bundle_stub,
    cross_tcg_validation_stub,
    dataset_registry_lookup_stub,
    formal_legality_expectation_stub,
    historical_benchmark_lineage_stub,
    judge_calibration_scoring_stub,
    replay_consistency_tracking_stub,
    run_benchmark_manifest_stub,
    runtime_confidence_stub,
    temporal_regression_drift_stub,
)


def test_ci_bundle() -> None:
    b = ci_evaluation_bundle_stub(suite="judge_grade", manifest_ids=["m1"])
    assert b["replay_consistency_governance"] is True


def test_benchmark_run() -> None:
    assert run_benchmark_manifest_stub("mid")["status"] == "completed_stub"


def test_registry() -> None:
    assert dataset_registry_lookup_stub("d1")["registered"] is True


def test_historical_lineage() -> None:
    assert historical_benchmark_lineage_stub(["a", "b"])["lineage_depth"] == 2


def test_replay_tracking() -> None:
    assert replay_consistency_tracking_stub("r", "x", "x")["consistent"] is True


def test_cross_tcg_soft() -> None:
    assert cross_tcg_validation_stub("mtg", "fab", spread=0.2)["calibration_score"] > 0.5


def test_formal_expectation() -> None:
    assert formal_legality_expectation_stub("c1", True)["passed"] is True


def test_temporal_regression() -> None:
    assert temporal_regression_drift_stub(["v1", "v2"])["drift_score"] > 0


def test_judge_calibration() -> None:
    assert judge_calibration_scoring_stub(0.05)["calibration_score"] > 0.9


def test_runtime_confidence() -> None:
    assert runtime_confidence_stub("reasoning_v3", 0.9)["score"] == 0.9
