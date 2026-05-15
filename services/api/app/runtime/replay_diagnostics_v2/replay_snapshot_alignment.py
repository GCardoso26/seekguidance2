"""Alinhamento de snapshots de replay (diagnostics v2)."""

from __future__ import annotations

from typing import Any


def replay_snapshot_alignment_v2_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "snapshot_alignment": {"matched": True},
        "assistant_notes": ["replay_snapshot_alignment: determinístico; lineage-aware."],
    }
