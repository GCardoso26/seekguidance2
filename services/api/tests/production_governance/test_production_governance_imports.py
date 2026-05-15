"""production_governance."""
from __future__ import annotations

from app.runtime.execution_governance_v2.runtime_governance_summary_v1 import runtime_governance_summary_v1_stub

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


def test_production_governance_payload() -> None:
    p = runtime_governance_summary_v1_stub("epv1-gov")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
