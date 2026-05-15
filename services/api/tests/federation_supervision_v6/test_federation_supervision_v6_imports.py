"""federation_supervision_v6."""
from __future__ import annotations

from app.runtime.replay_federation.federation_supervisor_runtime_v3 import federation_supervisor_runtime_v3_stub


def test_federation_supervision_v6_payload() -> None:
    p = federation_supervisor_runtime_v3_stub("node-a")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
