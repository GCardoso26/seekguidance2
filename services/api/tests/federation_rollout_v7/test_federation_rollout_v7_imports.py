"""federation_rollout_v7."""
from __future__ import annotations

from app.runtime.replay_federation.federation_rollout_safety_v1 import federation_rollout_safety_v1_stub


def test_federation_rollout_v7_payload() -> None:
    p = federation_rollout_safety_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
