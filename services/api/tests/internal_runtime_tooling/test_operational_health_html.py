"""Internal tooling HTML."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_operational_health_console() -> None:
    p = REPO / "apps/judge_console/operational_health_console.html"
    assert p.is_file()
