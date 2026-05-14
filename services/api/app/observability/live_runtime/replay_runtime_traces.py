"""Traces de replay em runtime."""

from __future__ import annotations

from app.observability.production_runtime.replay_trace_runtime import replay_trace_runtime_bundle


def replay_runtime_trace_stub(replay_id: str) -> dict[str, object]:
    return replay_trace_runtime_bundle(replay_id, reasoning_version=None)
