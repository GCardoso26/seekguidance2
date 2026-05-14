"""Realm / motor object-local (stub de contrato)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def realm_runtime_stub(realm_id: str) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"engine": "realm", "realm_id": realm_id},
        sync_hints=["Compactar histórico após export de slice."],
        deterministic_alignment={"migration_version": 1},
        mobile_constraints={"max_objects_soft": 50_000},
        offline_confidence=0.69,
        assistant_notes=["Realm opcional; SQLite permanece caminho mínimo portátil."],
        lineage_replay_slice="realm-v0",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"open": True, "compaction_pending": False},
        integrity_status={"checksum_pass": True},
        replay_alignment={"last_txn": "t0"},
        lineage_snapshot={"roots": 1},
        offline_constraints=["Sem sync implícito entre reinos distintos"],
    )
