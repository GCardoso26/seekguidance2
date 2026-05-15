"""federation_coordination."""
from __future__ import annotations

from app.runtime.federation_coordination.federation_runtime_coordination_engine_v1 import (
    federation_runtime_coordination_engine_v1_stub,
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
    "integrity_status",
)


def test_federation_coordination_payload() -> None:
    p = federation_runtime_coordination_engine_v1_stub("opv4-fed")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
