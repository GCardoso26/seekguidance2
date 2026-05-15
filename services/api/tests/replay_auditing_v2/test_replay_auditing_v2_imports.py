"""replay_auditing_v2."""
from __future__ import annotations

from app.runtime.replay_auditing.replay_determinism_audit_v2 import replay_determinism_audit_v2_stub


def test_replay_auditing_v2_payload() -> None:
    p = replay_determinism_audit_v2_stub("ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
