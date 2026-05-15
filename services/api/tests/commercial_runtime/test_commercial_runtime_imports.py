"""commercial_runtime."""
from __future__ import annotations

from app.runtime.commercial_runtime.runtime_commercial_summary_v1 import runtime_commercial_summary_v1_stub

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


def test_commercial_runtime_payload() -> None:
    p = runtime_commercial_summary_v1_stub("prov1-com")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
