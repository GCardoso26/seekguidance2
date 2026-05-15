"""runtime_operational_v11."""
from __future__ import annotations

from app.runtime.production_runtime.runtime_operational_scheduler_v4 import runtime_operational_scheduler_v4_stub

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


def test_runtime_operational_v11_payload() -> None:
    p = runtime_operational_scheduler_v4_stub("pp-sched")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
