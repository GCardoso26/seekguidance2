"""Replay cost heatmap."""

from __future__ import annotations

from app.observability.live_runtime import replay_cost_heatmap_stub


def test_cost_heatmap() -> None:
    h = replay_cost_heatmap_stub("c1")
    assert "assistant_notes" in h
