"""runtime_lifecycle_governance."""
from __future__ import annotations

from app.runtime.runtime_lifecycle_governance.runtime_lifecycle_summary_v1 import runtime_lifecycle_summary_v1_stub

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


def test_runtime_lifecycle_governance_payload() -> None:
    p = runtime_lifecycle_summary_v1_stub("om31-lc")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
