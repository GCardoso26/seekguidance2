"""Governança de snapshots (v3 stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def snapshot_governance_runtime_stub(snap_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"snap_id": snap_id, "governed": True},
        sync_hints=["TTL e pinning por disputa aberta."],
        deterministic_alignment={"token": f"sgr-{snap_id}"},
        mobile_constraints={"max_snaps": 32},
        offline_confidence=0.67,
        assistant_notes=["Snapshots sujeitos a política judge-grade."],
        lineage_replay_slice="sgr-v3",
    )
