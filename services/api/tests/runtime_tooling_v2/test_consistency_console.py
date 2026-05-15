"""Runtime tooling v2."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_replay_consistency_console() -> None:
    p = REPO / "apps/judge_console/replay_consistency_console.html"
    assert p.is_file()
