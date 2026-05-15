"""runtime_incident_workflows_v2."""
from __future__ import annotations

from app.runtime.runtime_incident_management.runtime_incident_recovery_engine_v3 import (
    runtime_incident_recovery_engine_v3_stub,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
)


def test_runtime_incident_workflows_v2_payload() -> None:
    p = runtime_incident_recovery_engine_v3_stub("opv2-inc")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
