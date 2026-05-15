"""deployment_readiness_v3."""
from __future__ import annotations

from app.runtime.deployment_readiness_v3.runtime_deployment_validation_v3 import runtime_deployment_validation_v3_stub

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


def test_deployment_readiness_v3_payload() -> None:
    p = runtime_deployment_validation_v3_stub("opv4-dep")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
