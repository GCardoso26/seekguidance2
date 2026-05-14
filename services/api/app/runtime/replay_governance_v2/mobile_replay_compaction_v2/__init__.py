"""Compactação de replay móvel v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_compaction_v2_stub(events: int, target: int) -> dict[str, Any]:
    return {
        "events": events,
        "target": target,
        "removed": max(0, events - target),
        "assistant_notes": ["Compactação preserva ordem relativa dentro dos segmentos mantidos."],
        "replay_summary": {"compaction": "v2-stub"},
        "deterministic_alignment": {"token": "mrcv2"},
        "lineage_replay_awareness": {"slice": "mrcv2"},
    }
