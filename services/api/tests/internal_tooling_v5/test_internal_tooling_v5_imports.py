"""Internal tooling v5."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_runtime_scheduler_console_exists() -> None:
    assert (REPO / "apps" / "judge_console" / "runtime_scheduler_console.html").is_file()
