"""Snapshots compactos de replay para armazenamento local (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_replay_snapshot_stub(snapshot_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"snapshot_id": snapshot_id, "format": "compact-v0", "events": 24},
        sync_hints=["Upload diferido; verificar integridade antes do merge."],
        deterministic_alignment={"snapshot_hash": f"sn-{snapshot_id}"},
        mobile_constraints={"max_snapshot_kb": 256},
        offline_confidence=0.73,
        assistant_notes=["Snapshot é fatia replay-first; explainability embutida nos metadados."],
        lineage_replay_slice=f"snap-{snapshot_id}",
    )
