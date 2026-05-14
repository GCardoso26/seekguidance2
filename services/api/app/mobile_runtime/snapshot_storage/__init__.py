"""Snapshots versionados em disco (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def snapshot_storage_stub(snap_id: str, version: int) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"snap_id": snap_id, "version": version},
        sync_hints=["Assinar digest antes de upload.", "Rejeitar downgrade de versão."],
        deterministic_alignment={"monotonic_version": True},
        mobile_constraints={"max_snap_mb": 32},
        offline_confidence=0.71,
        assistant_notes=["Versionamento explícito para merge determinístico."],
        lineage_replay_slice=f"snap-{snap_id}",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"snapshots": 3, "prunable": 1},
        integrity_status={"digest": f"d-{snap_id}", "ok": True},
        replay_alignment={"base_version": version - 1 if version else 0},
        lineage_snapshot={"parent": snap_id},
        offline_constraints=["Retenção curta em modo torneio"],
    )
