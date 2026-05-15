"""connected_observability_v5."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_observability_summary_v5 import (
    runtime_observability_summary_v5_stub,
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

def test_connected_observability_v5_payload() -> None:
    p = runtime_observability_summary_v5_stub("prov5-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
