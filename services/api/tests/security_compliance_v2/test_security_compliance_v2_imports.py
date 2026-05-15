"""security_compliance_v2."""
from __future__ import annotations

from app.runtime.security_compliance.runtime_security_operational_engine_v2 import (
    runtime_security_operational_engine_v2_stub,
)

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


def test_security_compliance_v2_payload() -> None:
    p = runtime_security_operational_engine_v2_stub("gav2-sec")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
