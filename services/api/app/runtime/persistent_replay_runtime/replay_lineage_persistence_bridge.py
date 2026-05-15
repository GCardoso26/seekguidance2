"""Persistência de lineage de replay (stub)."""

from __future__ import annotations

from typing import Any


def replay_lineage_persistence_bridge_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "lineage_persistence_summary": {"anchors_written": True},
        "assistant_notes": ["replay_lineage_persistence_bridge: merges explicáveis."],
    }
