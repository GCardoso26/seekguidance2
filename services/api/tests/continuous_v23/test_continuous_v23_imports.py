"""continuous_v23."""
from __future__ import annotations

from app.evaluation.continuous_v23 import runtime_operational_regression_v23_stub


def test_continuous_v23() -> None:
    p = runtime_operational_regression_v23_stub("sig23")
    assert p["operational_confidence"] > 0
