"""deployment_runtime_v7."""
from __future__ import annotations

from app.runtime.deployment_runtime.deployment_orchestrator_v1 import deployment_orchestrator_v1_stub


def test_deployment_runtime_v7_payload() -> None:
    p = deployment_orchestrator_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
