"""Runtime health federation."""

from __future__ import annotations

from app.runtime.runtime_health_federation import replay_health_scoring_stub


def test_replay_health_scoring() -> None:
    s = replay_health_scoring_stub("s1")
    assert "assistant_notes" in s
