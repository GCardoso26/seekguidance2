"""Export de metadados de trace para replays (correlação)."""

from __future__ import annotations

from typing import Any

from app.observability.runtime_tracing.replay_trace_correlation import correlate_replay_to_trace


def export_replay_trace_bundle(replay_id: str, *, reasoning_version: str | None) -> dict[str, Any]:
    payload = correlate_replay_to_trace(replay_id, reasoning_version=reasoning_version)
    return {"kind": "replay_trace", "payload": payload}
