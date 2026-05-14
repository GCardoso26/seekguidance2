"""Snapshots offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_snapshot_runtime_stub(snap_id: str) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"snap_id": snap_id, "bytes": 1024},
        sync_hints=["Assinar snapshot antes de upload."],
        deterministic_alignment={"hash": f"snp-{snap_id}"},
        mobile_constraints={"max_kb": 512},
        offline_confidence=0.74,
        assistant_notes=["Integridade local + validação remota opcional."],
        lineage_replay_slice=f"snp-{snap_id}",
        offline_limitations=["Sem arquivo longo prazo apenas local"],
        sync_conflicts=[],
        replay_alignment={"verified": False},
    )
