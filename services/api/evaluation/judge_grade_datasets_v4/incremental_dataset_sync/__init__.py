"""Sincronização incremental de datasets (stub)."""

from __future__ import annotations

from typing import Any


def incremental_dataset_sync_stub(cursor: str) -> dict[str, Any]:
    return {
        "cursor": cursor,
        "replay_summary": {"deltas": 2},
        "assistant_notes": ["Delta sync preserva determinismo com cursor versionado."],
        "sync_hints": ["Rejeitar delta se lineage divergir."],
        "deterministic_alignment": {"next_cursor": f"{cursor}-n"},
        "mobile_constraints": {"max_delta_kb": 128},
        "offline_confidence": 0.52,
        "lineage_replay_awareness": {"slice": "ids-v0"},
    }
