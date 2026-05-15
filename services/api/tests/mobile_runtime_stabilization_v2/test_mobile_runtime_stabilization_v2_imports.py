"""mobile_runtime_stabilization_v2."""
from __future__ import annotations

from app.mobile_runtime.mobile_runtime_sync_engine_v2 import mobile_runtime_sync_engine_v2_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)

def test_mobile_runtime_stabilization_v2_payload() -> None:
    p = mobile_runtime_sync_engine_v2_stub("device10")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
