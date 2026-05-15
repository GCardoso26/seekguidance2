"""federation_rollout_v2."""
from __future__ import annotations

from app.runtime.replay_federation.federation_rollout_guard_v2 import federation_rollout_guard_v2_stub


def test_federation_rollout_v2_payload() -> None:
    p = federation_rollout_guard_v2_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
