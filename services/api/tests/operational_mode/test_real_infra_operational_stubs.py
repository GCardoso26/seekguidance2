"""Real infrastructure operational stubs."""
from __future__ import annotations

from app.runtime.runtime_real_infrastructure.runtime_real_runtime_monitor_v1 import (
    runtime_real_runtime_monitor_v1_stub,
)
from app.runtime.runtime_real_infrastructure.runtime_real_scaling_engine_v1 import (
    runtime_real_scaling_engine_v1_stub,
)


def test_scaling_stub() -> None:
    assert runtime_real_scaling_engine_v1_stub("x")["operational_score"] > 0


def test_monitor_stub() -> None:
    assert runtime_real_runtime_monitor_v1_stub("x")["operational_score"] > 0
