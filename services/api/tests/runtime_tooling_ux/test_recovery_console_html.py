"""Runtime tooling UX."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_replay_recovery_console() -> None:
    p = REPO / "apps/judge_console/replay_recovery_console.html"
    assert p.is_file()
