"""continuous_v22."""
from __future__ import annotations

from app.evaluation.continuous_v22 import runtime_operational_regression_v22_stub


def test_continuous_v22() -> None:
    p = runtime_operational_regression_v22_stub("sig22")
    assert p["operational_confidence"] > 0
