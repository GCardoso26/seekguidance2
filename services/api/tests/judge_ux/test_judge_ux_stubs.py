"""Stubs HTML de UX (existência no monorepo)."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

HTML = [
    "apps/judge_replay/timeline_compare.html",
    "apps/judge_replay/branch_explorer.html",
    "apps/judge_replay/replay_heatmap.html",
    "apps/judge_replay/multiplayer_priority_view.html",
    "apps/judge_replay/interactive_replay_timeline.html",
    "apps/judge_replay/legality_overlay_stub.html",
    "apps/judge_replay/reasoning_graph_stub.html",
    "apps/stack_visualizer/chain_view.html",
    "apps/stack_visualizer/dependency_graph.html",
    "apps/stack_visualizer/trigger_order_view.html",
    "apps/stack_visualizer/APNAP_view.html",
    "apps/judge_console/dispute_workspace.html",
    "apps/judge_console/ruling_workspace.html",
    "apps/judge_console/investigation_view.html",
    "apps/judge_console/temporal_compare_view.html",
    "apps/tournament_ops/index.html",
    "apps/judge_training/index.html",
    "apps/judge_training/quiz_stub.html",
    "apps/judge_console/dispute_flow_stub.html",
]


def test_judge_ux_stub_files_exist() -> None:
    for rel in HTML:
        assert (REPO / rel).is_file(), rel
