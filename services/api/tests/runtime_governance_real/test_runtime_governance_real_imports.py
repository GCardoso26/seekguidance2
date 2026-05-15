"""runtime_governance_real."""
from __future__ import annotations

from app.runtime.execution_governance_v2.runtime_operational_policy_validation_v3 import (
    runtime_operational_policy_validation_v3_stub,
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


def test_runtime_governance_real_payload() -> None:
    p = runtime_operational_policy_validation_v3_stub("pcv1-gov")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
