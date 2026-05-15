"""continuous_v24."""
from __future__ import annotations

from app.evaluation.continuous_v24 import reliability_regression_v24_stub


def test_continuous_v24() -> None:
    p = reliability_regression_v24_stub("sig24")
    assert p["operational_confidence"] > 0
