"""Judge tooling v2."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_runtime_execution_console() -> None:
    p = REPO / "apps/judge_console/runtime_execution_console.html"
    assert p.is_file()
