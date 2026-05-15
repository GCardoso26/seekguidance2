"""continuous_v31."""
from __future__ import annotations

from app.evaluation.continuous_v31 import operations_center_regression_v31_stub


def test_continuous_v31() -> None:
    p = operations_center_regression_v31_stub("sig31")
    assert p["operational_confidence"] > 0
