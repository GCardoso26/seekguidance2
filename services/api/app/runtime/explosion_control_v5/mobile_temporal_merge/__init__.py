"""Merge temporal incremental no mobile (stub)."""

from __future__ import annotations

from typing import Any


def mobile_temporal_merge_stub(clocks: int) -> dict[str, Any]:
    return {
        "clocks": clocks,
        "merged_order": list(range(min(clocks, 4))),
        "assistant_notes": ["Merge determinístico por ordenação estável de relógios locais."],
        "replay_summary": {"players": clocks},
        "sync_hints": ["Reconciliar com servidor para torneios oficiais."],
        "deterministic_alignment": {"policy": "stable-sort-v0"},
        "mobile_constraints": {"max_clocks": 8},
        "offline_confidence": 0.53,
        "lineage_replay_awareness": {"slice": "mtmerge-v0"},
    }
