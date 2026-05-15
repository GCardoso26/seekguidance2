"""Runtime governance v3."""

from __future__ import annotations

from app.runtime.runtime_governance_v3 import replay_governance_federation_stub


def test_replay_governance_federation() -> None:
    g = replay_governance_federation_stub("s1")
    assert "assistant_notes" in g
