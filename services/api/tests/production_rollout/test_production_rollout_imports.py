"""production_rollout."""
from __future__ import annotations

from app.runtime.production_rollout.production_rollout_runtime_v1 import production_rollout_runtime_v1_stub

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


def test_production_rollout_payload() -> None:
    p = production_rollout_runtime_v1_stub("prov1-roll")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
