"""pilot production."""
from __future__ import annotations

from app.runtime.pilot_runtime.pilot_runtime_operational_controller_v2 import (
    pilot_runtime_operational_controller_v2_stub,
)


def test_pilot_v2() -> None:
    out = pilot_runtime_operational_controller_v2_stub("pilot-pp")
    assert out["readiness_score"] > 0
