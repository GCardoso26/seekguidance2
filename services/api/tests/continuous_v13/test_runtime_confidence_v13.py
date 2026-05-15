"""Continuous v13."""

from __future__ import annotations

from app.evaluation.continuous_v13 import runtime_confidence_regression_v13_stub


def test_continuous_v13() -> None:
    p = runtime_confidence_regression_v13_stub("sig13")
    assert p["runtime_confidence"] > 0
    assert "regression_summary" in p
