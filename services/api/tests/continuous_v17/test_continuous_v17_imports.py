"""continuous_v17."""
from __future__ import annotations

from app.evaluation.continuous_v17 import runtime_operational_regression_v17_stub


def test_continuous_v17() -> None:
    p = runtime_operational_regression_v17_stub("sig17")
    assert p["operational_confidence"] > 0
