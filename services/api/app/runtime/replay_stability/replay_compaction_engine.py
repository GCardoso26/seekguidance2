"""Motor de compactação de replay (métricas + lista limitada)."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.replay_explosion_control import replay_dedupe_events


def replay_compaction_report(events: list[dict[str, Any]], *, max_events: int) -> dict[str, Any]:
    compact, meta = replay_dedupe_events(events, max_events=max_events)
    return {"events": compact, "meta": meta, "compacted": len(events) - len(compact)}
