"""continuous_v28."""
from __future__ import annotations

from app.evaluation.continuous_v28 import operational_production_regression_v28_stub


def test_continuous_v28() -> None:
    p = operational_production_regression_v28_stub("sig28")
    assert p["operational_confidence"] > 0
