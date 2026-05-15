"""deployment_runtime_v5."""
from __future__ import annotations

from app.runtime.runtime_distribution.runtime_deployment_summary_v2 import runtime_deployment_summary_v2_stub

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


def test_deployment_runtime_v5_payload() -> None:
    p = runtime_deployment_summary_v2_stub("ga30-dep")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
