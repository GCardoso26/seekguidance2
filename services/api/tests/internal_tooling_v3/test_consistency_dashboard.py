"""Tooling v3."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_consistency_dashboard() -> None:
    assert (REPO / "apps/judge_console/runtime_consistency_dashboard.html").is_file()
