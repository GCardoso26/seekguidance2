"""runtime_incident_v6."""
from __future__ import annotations

from app.runtime.runtime_incident_management.runtime_incident_orchestrator_v2 import (
    runtime_incident_orchestrator_v2_stub,
)


def test_runtime_incident_v6_payload() -> None:
    p = runtime_incident_orchestrator_v2_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
