"""Compactação temporal de ramos de replay."""

from __future__ import annotations

from typing import Any


def temporal_replay_compaction_stub(timelines: int, max_kept: int) -> dict[str, Any]:
    return {
        "timelines": timelines,
        "max_kept": max_kept,
        "compacted": max(0, timelines - max_kept),
        "assistant_notes": ["Mantém lineage temporal consultável sem duplicar estados equivalentes."],
    }
