"""replay_deterministic_auditing_v3."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_deterministic_audit_runtime_v3 import (
    replay_deterministic_audit_runtime_v3_stub,
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


def test_replay_deterministic_auditing_v3_payload() -> None:
    p = replay_deterministic_audit_runtime_v3_stub("rc-replay")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
