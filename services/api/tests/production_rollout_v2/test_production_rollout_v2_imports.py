"""production_rollout_v2."""
from __future__ import annotations

from app.runtime.production_rollout_v2.production_rollout_orchestration_v2 import (
    production_rollout_orchestration_v2_stub,
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


def test_production_rollout_v2_payload() -> None:
    p = production_rollout_orchestration_v2_stub("gav2-roll")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
