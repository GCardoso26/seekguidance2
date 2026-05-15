"""runtime_governance_rc."""
from __future__ import annotations

from app.runtime.runtime_trust_scoring.runtime_operational_trust_engine_v2 import (
    runtime_operational_trust_engine_v2_stub,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def test_runtime_governance_rc_payload() -> None:
    p = runtime_operational_trust_engine_v2_stub("rc-gov")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
