"""mobile_runtime_rc."""
from __future__ import annotations

from app.mobile_runtime.mobile_runtime_reconciliation_engine_v3 import mobile_runtime_reconciliation_engine_v3_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def test_mobile_runtime_rc_payload() -> None:
    p = mobile_runtime_reconciliation_engine_v3_stub("rc-mobile")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
