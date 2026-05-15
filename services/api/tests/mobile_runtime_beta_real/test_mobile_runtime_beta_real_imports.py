"""mobile_runtime_beta_real."""
from __future__ import annotations

from app.mobile_runtime.mobile_runtime_operational_sync_v1 import mobile_runtime_operational_sync_v1_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
    "lineage_summary",
)


def test_mobile_runtime_beta_real_payload() -> None:
    p = mobile_runtime_operational_sync_v1_stub("pp-mobile")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
