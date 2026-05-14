"""Merge temporal de replay móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_temporal_merge_governance_stub(ticks: int) -> dict[str, Any]:
    return {
        "ticks": ticks,
        "assistant_notes": ["Merge estável por tick; revalidar com servidor em torneio."],
        "replay_summary": {"merged_ticks": min(ticks, 128)},
        "deterministic_alignment": {"ordering": "stable"},
        "lineage_replay_awareness": {"slice": "mrtmg-v0"},
    }
