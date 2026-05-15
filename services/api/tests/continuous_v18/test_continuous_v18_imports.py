"""continuous_v18."""
from __future__ import annotations

from app.evaluation.continuous_v18 import runtime_execution_regression_v18_stub


def test_continuous_v18() -> None:
    p = runtime_execution_regression_v18_stub("sig18")
    assert p["operational_confidence"] > 0
