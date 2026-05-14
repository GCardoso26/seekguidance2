"""Registo de snapshots semânticos."""

from __future__ import annotations

from typing import Any


def semantic_snapshot_registry_stub(snap_id: str) -> dict[str, Any]:
    return {
        "snap_id": snap_id,
        "ontology_replay_alignment": True,
        "assistant_notes": ["Ontology lineage tracking."],
    }
