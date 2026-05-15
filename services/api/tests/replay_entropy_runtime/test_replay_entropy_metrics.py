"""Métricas de entropia de replay."""

from __future__ import annotations

from app.observability.live_runtime.replay_entropy_runtime_metrics import replay_entropy_runtime_metrics_stub


def test_replay_entropy_metrics() -> None:
    m = replay_entropy_runtime_metrics_stub("e1")
    assert isinstance(m, dict)
