"""replay_integrity_v6."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_execution_integrity_engine_v6 import (
    replay_execution_integrity_engine_v6_stub,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)

def test_replay_integrity_v6_payload() -> None:
    p = replay_execution_integrity_engine_v6_stub("replay10")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
