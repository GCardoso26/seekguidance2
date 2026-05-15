"""federation_supervision_rc."""
from __future__ import annotations

from app.runtime.replay_federation.federation_operational_supervisor_v1 import federation_operational_supervisor_v1_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def test_federation_supervision_rc_payload() -> None:
    p = federation_operational_supervisor_v1_stub("rc-fed")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
