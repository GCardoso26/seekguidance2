"""continuous_v30."""
from __future__ import annotations

from app.evaluation.continuous_v30 import ga_readiness_regression_v30_stub


def test_continuous_v30() -> None:
    p = ga_readiness_regression_v30_stub("sig30")
    assert p["operational_confidence"] > 0
