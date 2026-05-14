"""Judge UX v3."""

from __future__ import annotations

from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]


@pytest.mark.parametrize(
    "rel",
    [
        "apps/judge_replay/legality_proof_viewer.html",
        "apps/stack_visualizer/segoc_visualizer.html",
        "apps/judge_console/replay_governance_panel.html",
    ],
)
def test_judge_ux_v3_stub(rel: str) -> None:
    p = REPO / rel
    assert p.is_file()
    assert "<!DOCTYPE html>" in p.read_text(encoding="utf-8")
