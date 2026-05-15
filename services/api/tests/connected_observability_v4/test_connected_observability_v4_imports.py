"""connected_observability_v4."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_observability_summary_v4 import (
    runtime_observability_summary_v4_stub,
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

def test_connected_observability_v4_payload() -> None:
    p = runtime_observability_summary_v4_stub("epv4-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
