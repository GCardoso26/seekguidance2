"""continuous_v15."""
from __future__ import annotations

from app.evaluation.continuous_v15 import runtime_execution_regression_v15_stub


def test_continuous_v15() -> None:
    p = runtime_execution_regression_v15_stub("sig")
    assert p["runtime_confidence"] > 0
    assert "drift_summary" in p
