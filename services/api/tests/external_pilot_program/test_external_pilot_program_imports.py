"""external_pilot_program."""
from __future__ import annotations

from app.runtime.external_pilot_program.external_pilot_operator_registry_v1 import (
    external_pilot_operator_registry_v1_stub,
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


def test_external_pilot_program_payload() -> None:
    p = external_pilot_operator_registry_v1_stub("pcv1-pilot")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
