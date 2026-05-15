"""runtime_scale_reliability_v2."""
from __future__ import annotations

from app.runtime.runtime_scale_reliability.runtime_operational_resilience_scoring_v2 import (
    runtime_operational_resilience_scoring_v2_stub,
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


def test_runtime_scale_reliability_v2_payload() -> None:
    p = runtime_operational_resilience_scoring_v2_stub("gav2-scale")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
