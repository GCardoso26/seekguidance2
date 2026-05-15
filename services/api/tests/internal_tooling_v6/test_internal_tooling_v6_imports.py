"""Internal tooling v6."""
from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_runtime_execution_console_v2() -> None:
    assert (REPO / "apps" / "judge_console" / "runtime_execution_console_v2.html").is_file()
