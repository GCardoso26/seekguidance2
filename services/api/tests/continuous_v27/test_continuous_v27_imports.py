"""continuous_v27."""
from __future__ import annotations

from app.evaluation.continuous_v27 import ga_readiness_regression_v27_stub


def test_continuous_v27() -> None:
    p = ga_readiness_regression_v27_stub("sig27")
    assert p["operational_confidence"] > 0
