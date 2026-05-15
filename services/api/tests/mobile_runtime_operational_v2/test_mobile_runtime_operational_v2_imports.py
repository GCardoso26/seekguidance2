"""mobile_runtime_operational_v2."""
from __future__ import annotations

from app.mobile_runtime.mobile_runtime_operational_engine_v2 import mobile_runtime_operational_engine_v2_stub

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


def test_mobile_runtime_operational_v2_payload() -> None:
    p = mobile_runtime_operational_engine_v2_stub("opv4-mobile")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
