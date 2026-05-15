"""runtime_infrastructure."""
from __future__ import annotations

from app.runtime.runtime_infrastructure.runtime_infrastructure_summary_v1 import runtime_infrastructure_summary_v1_stub

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


def test_runtime_infrastructure_payload() -> None:
    p = runtime_infrastructure_summary_v1_stub("prov1-infra")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
