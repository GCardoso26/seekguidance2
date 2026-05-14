"""Continuous evaluation v7."""

from __future__ import annotations

from app.evaluation.continuous_v7 import (
    judge_grade_consistency_v7_stub,
    operational_confidence_tracking_stub,
    replay_stability_tracking_v7_stub,
)


def test_judge_grade_consistency() -> None:
    assert judge_grade_consistency_v7_stub(0.9)["trend_analysis"] == "stable"


def test_replay_stability_tracking() -> None:
    assert replay_stability_tracking_v7_stub([True, True])["stable_ratio"] == 1.0


def test_operational_confidence() -> None:
    assert operational_confidence_tracking_stub([0.8, 0.9])["operational_confidence"] > 0.8
