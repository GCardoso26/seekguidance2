"""runtime_execution_v10."""
from __future__ import annotations

from app.runtime.production_runtime.runtime_execution_state_machine_v2 import runtime_execution_state_machine_v2_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)

def test_runtime_execution_v10_payload() -> None:
    p = runtime_execution_state_machine_v2_stub("exec10")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
