"""runtime_incident_management_v5 imports."""

from __future__ import annotations

from app.runtime.runtime_incident_management import runtime_incident_registry_stub


def test_runtime_incident_management_v5_payload() -> None:
    p = runtime_incident_registry_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
