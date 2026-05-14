"""Snapshots offline de datasets (stub)."""

from __future__ import annotations

from typing import Any


def offline_dataset_snapshot_stub(snap_id: str) -> dict[str, Any]:
    return {
        "snap_id": snap_id,
        "replay_summary": {"bytes": 4096},
        "assistant_notes": ["Snapshot assinável; validação remota opcional."],
        "sync_hints": ["Upload diferido em fila segura."],
        "deterministic_alignment": {"hash": f"ods-{snap_id}"},
        "mobile_constraints": {"max_kb": 512},
        "offline_confidence": 0.6,
        "lineage_replay_awareness": {"slice": f"ods-{snap_id}"},
    }
