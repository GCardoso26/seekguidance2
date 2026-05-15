"""continuous_v21."""
from __future__ import annotations

from app.evaluation.continuous_v21 import runtime_operational_regression_v21_stub


def test_continuous_v21() -> None:
    p = runtime_operational_regression_v21_stub("sig21")
    assert p["operational_confidence"] > 0
