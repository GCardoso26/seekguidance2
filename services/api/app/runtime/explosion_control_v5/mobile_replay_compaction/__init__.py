"""Compactação de replay orientada a mobile (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_compaction_stub(events: int, target: int) -> dict[str, Any]:
    removed = max(0, events - target)
    return {
        "events": events,
        "target": target,
        "removed": removed,
        "assistant_notes": ["Compactação não altera ordem dentro dos chunks mantidos."],
        "replay_summary": {"compacted_events": target},
        "sync_hints": ["Preferir chunks com lineage explícito."],
        "deterministic_alignment": {"compaction": "mrc-v0"},
        "mobile_constraints": {"target_events": target},
        "offline_confidence": 0.7,
        "lineage_replay_awareness": {"slice": "mreplay-compact-v0"},
    }
