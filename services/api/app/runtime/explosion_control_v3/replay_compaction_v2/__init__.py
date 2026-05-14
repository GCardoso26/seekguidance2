"""Compactação de replay V2 (dedupe determinístico)."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.replay_explosion_control import replay_dedupe_events

EventDict = dict[str, Any]


def replay_compaction_v2(
    events: list[EventDict],
    *,
    max_events: int,
) -> tuple[list[EventDict], dict[str, Any]]:
    return replay_dedupe_events(events, max_events=max_events)
