"""replay_diagnostics_v2."""

from __future__ import annotations

from app.runtime.replay_diagnostics_v2 import replay_entropy_analysis_v2_stub


def test_replay_diagnostics_v2() -> None:
    d = replay_entropy_analysis_v2_stub("r")
    assert "entropy_hint" in d
