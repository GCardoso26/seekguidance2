"""continuous_v14 imports."""

from __future__ import annotations

from app.evaluation.continuous_v14 import runtime_execution_regression_v14_stub


def test_continuous_v14_payload() -> None:
    p = runtime_execution_regression_v14_stub("sig")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
