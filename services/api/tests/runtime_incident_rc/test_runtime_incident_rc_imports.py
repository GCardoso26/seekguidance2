"""runtime_incident_rc."""
from __future__ import annotations

from app.runtime.runtime_incident_management.runtime_incident_operational_engine_v2 import (
    runtime_incident_operational_engine_v2_stub,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def test_runtime_incident_rc_payload() -> None:
    p = runtime_incident_operational_engine_v2_stub("rc-inc")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
