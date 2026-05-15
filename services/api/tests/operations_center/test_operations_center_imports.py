"""operations_center."""
from __future__ import annotations

from app.runtime.platform_operations_center.operations_center_summary_v1 import operations_center_summary_v1_stub

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


def test_operations_center_payload() -> None:
    p = operations_center_summary_v1_stub("om31-poc")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
