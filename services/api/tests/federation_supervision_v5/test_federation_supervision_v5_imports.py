"""federation_supervision_v5 imports."""

from __future__ import annotations

from app.runtime.replay_federation import federation_supervisor_runtime_v2_stub


def test_federation_supervision_v5_payload() -> None:
    p = federation_supervisor_runtime_v2_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
