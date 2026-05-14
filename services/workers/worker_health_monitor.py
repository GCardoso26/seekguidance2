"""Monitor de health de workers (heartbeat + fila)."""

from __future__ import annotations

from typing import Any

from orchestration_runtime import worker_heartbeat_ok


def worker_health_snapshot(*, last_beat_ts: float, now: float, queue_depth: int) -> dict[str, Any]:
    return {
        "heartbeat_ok": worker_heartbeat_ok(last_beat_ts, now),
        "queue_depth": queue_depth,
    }
