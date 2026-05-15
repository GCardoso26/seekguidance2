"""continuous_v26."""
from __future__ import annotations

from app.evaluation.continuous_v26 import production_rollout_regression_v26_stub


def test_continuous_v26() -> None:
    p = production_rollout_regression_v26_stub("sig26")
    assert p["operational_confidence"] > 0
