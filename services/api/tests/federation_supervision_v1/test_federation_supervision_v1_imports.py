"""federation_supervision_v1."""
from __future__ import annotations

from app.runtime.replay_federation.federation_supervision_runtime_v1 import federation_supervision_runtime_v1_stub


def test_federation_supervision_v1_payload() -> None:
    p = federation_supervision_runtime_v1_stub("node")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
    assert "deterministic_alignment" in p
