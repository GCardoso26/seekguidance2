"""external_production_pilot_v2."""
from __future__ import annotations

from app.runtime.external_pilot_program.external_production_pilot_engine_v2 import (
    external_production_pilot_engine_v2_stub,
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


def test_external_production_pilot_v2_payload() -> None:
    p = external_production_pilot_engine_v2_stub("epv2-pilot")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
