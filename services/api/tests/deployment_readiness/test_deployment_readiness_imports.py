"""deployment_readiness."""
from __future__ import annotations

from app.runtime.deployment_readiness.runtime_deployment_validation_v1 import runtime_deployment_validation_v1_stub

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


def test_deployment_readiness_payload() -> None:
    p = runtime_deployment_validation_v1_stub("pp-dep")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
