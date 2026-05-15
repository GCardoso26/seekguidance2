"""Saúde de replay runtime."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_runtime_health import replay_runtime_health_stub


def test_replay_runtime_health_stub() -> None:
    h = replay_runtime_health_stub("h1")
    assert isinstance(h, dict)
