"""continuous_v29."""
from __future__ import annotations

from app.evaluation.continuous_v29 import enterprise_production_regression_v29_stub


def test_continuous_v29() -> None:
    p = enterprise_production_regression_v29_stub("sig29")
    assert p["operational_confidence"] > 0
