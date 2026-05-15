"""runtime_incident_v3."""
from __future__ import annotations

from app.runtime.runtime_incident_management.runtime_incident_engine_v3 import runtime_incident_engine_v3_stub


def test_runtime_incident_v3_payload() -> None:
    p = runtime_incident_engine_v3_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
