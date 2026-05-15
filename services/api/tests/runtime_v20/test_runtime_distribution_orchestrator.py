"""Runtime distribution orchestrator."""
from __future__ import annotations

from app.runtime.runtime_distribution.runtime_real_deployment_orchestrator_v1 import (
    runtime_real_deployment_orchestrator_engine_v1,
)


def test_deployment_orchestrator_engine() -> None:
    r = runtime_real_deployment_orchestrator_engine_v1("om20-d")
    assert r["deployment_score"] > 0
