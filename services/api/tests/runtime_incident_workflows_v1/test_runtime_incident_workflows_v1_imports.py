"""runtime_incident_workflows_v1."""
from __future__ import annotations

from app.runtime.runtime_incident_management.runtime_incident_storage_v1 import runtime_incident_storage_v1_stub


def test_runtime_incident_workflows_v1_payload() -> None:
    p = runtime_incident_storage_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
    assert "deterministic_alignment" in p
