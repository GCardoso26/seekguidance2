"""production_deployment_readiness_v2."""
from __future__ import annotations

from app.runtime.deployment_readiness_v2.runtime_deployment_readiness_engine_v2 import (
    runtime_deployment_readiness_engine_v2_stub,
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
)


def test_production_deployment_readiness_v2_payload() -> None:
    p = runtime_deployment_readiness_engine_v2_stub("opv2-dep")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
