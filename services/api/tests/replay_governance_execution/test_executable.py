"""Governança executável."""

from __future__ import annotations

from app.runtime.replay_governance_v2 import executable_replay_governance_stub


def test_executable_stub() -> None:
    g = executable_replay_governance_stub("z")
    assert "scores" in g
