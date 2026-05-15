"""Runtime alignment metrics."""

from __future__ import annotations

from app.observability.live_runtime import replay_runtime_alignment_metrics_stub


def test_alignment_metrics() -> None:
    m = replay_runtime_alignment_metrics_stub("a1")
    assert "deterministic_alignment" in m
