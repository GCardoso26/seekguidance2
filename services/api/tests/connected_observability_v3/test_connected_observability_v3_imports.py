"""connected_observability_v3."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_connected_observability_engine_v3 import (
    runtime_connected_observability_engine_v3_stub,
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


def test_connected_observability_v3_payload() -> None:
    p = runtime_connected_observability_engine_v3_stub("opv4-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
