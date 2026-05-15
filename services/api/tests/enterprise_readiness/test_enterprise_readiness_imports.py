"""enterprise_readiness."""
from __future__ import annotations

from app.runtime.enterprise_readiness.runtime_enterprise_readiness_v1 import runtime_enterprise_readiness_v1_stub

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


def test_enterprise_readiness_payload() -> None:
    p = runtime_enterprise_readiness_v1_stub("epv1-ent")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
