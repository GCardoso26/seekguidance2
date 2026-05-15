"""runtime_operational_rc."""
from __future__ import annotations

from app.runtime.production_runtime.runtime_operational_controller_v1 import runtime_operational_controller_v1_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def test_runtime_operational_rc_payload() -> None:
    p = runtime_operational_controller_v1_stub("rc-ops")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
