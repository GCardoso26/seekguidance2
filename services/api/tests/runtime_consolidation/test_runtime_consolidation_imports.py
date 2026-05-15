"""runtime_consolidation."""
from __future__ import annotations

from app.runtime.runtime_consolidation.runtime_payload_normalization_v1 import runtime_payload_normalization_v1_stub

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


def test_runtime_consolidation_payload() -> None:
    p = runtime_payload_normalization_v1_stub("pcv1-cons")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
