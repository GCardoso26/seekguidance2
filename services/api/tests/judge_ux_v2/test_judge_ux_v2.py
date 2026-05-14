"""Judge UX v2 — ficheiros presentes."""

from __future__ import annotations

from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]


@pytest.mark.parametrize(
    "rel",
    [
        "apps/judge_replay/replay_diff_viewer.html",
        "apps/judge_replay/causal_graph_explorer.html",
        "apps/stack_visualizer/replacement_recursion_explorer.html",
        "apps/tournament_ops/workflow_stub.html",
    ],
)
def test_ux_stub_exists(rel: str) -> None:
    p = REPO / rel
    assert p.is_file()
    text = p.read_text(encoding="utf-8")
    assert "<!DOCTYPE html>" in text
