"""Attestation de snapshot (stub v2)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def snapshot_attestation_stub(snap_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"snap_id": snap_id, "signed": True},
        sync_hints=["Rejeitar snapshot sem metadados de lineage mínimos."],
        deterministic_alignment={"digest": f"sa-{snap_id}"},
        mobile_constraints={"max_kb": 512},
        offline_confidence=0.72,
        assistant_notes=["Snapshots verificáveis antes de aplicar patch de dataset."],
        lineage_replay_slice=f"sa-{snap_id}",
    )
