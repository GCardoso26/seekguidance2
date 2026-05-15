"""continuous_v20."""
from __future__ import annotations

from app.evaluation.continuous_v20 import runtime_operational_release_regression_v20_stub


def test_continuous_v20() -> None:
    p = runtime_operational_release_regression_v20_stub("sig20")
    assert p["operational_confidence"] > 0
