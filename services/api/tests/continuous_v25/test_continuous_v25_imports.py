"""continuous_v25."""
from __future__ import annotations

from app.evaluation.continuous_v25 import external_pilot_regression_v25_stub


def test_continuous_v25() -> None:
    p = external_pilot_regression_v25_stub("sig25")
    assert p["operational_confidence"] > 0
