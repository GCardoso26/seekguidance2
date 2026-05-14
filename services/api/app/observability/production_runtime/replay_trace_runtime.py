"""Bundle de trace em runtime de replay."""

from __future__ import annotations

from typing import Any

from app.observability.runtime_tracing.replay_trace_exporter import export_replay_trace_bundle


def replay_trace_runtime_bundle(replay_id: str, *, reasoning_version: str | None) -> dict[str, Any]:
    return export_replay_trace_bundle(replay_id, reasoning_version=reasoning_version)
