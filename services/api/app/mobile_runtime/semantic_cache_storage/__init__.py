"""Cache semântico persistente (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def semantic_cache_storage_stub(entries: int) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"entries": entries, "ttl_s": 7200},
        sync_hints=["Invalidar por policy_version bump."],
        deterministic_alignment={"cache_gen": "sem-store-v0"},
        mobile_constraints={"max_mb": 48},
        offline_confidence=0.62,
        assistant_notes=["Cache acelera consultas; não substitui reasoning_v* no núcleo."],
        lineage_replay_slice="sem-cache-v0",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"dirty": entries > 0},
        integrity_status={"schema_ok": True},
        replay_alignment={"policy_version": 3},
        lineage_snapshot={"sources": ["ontology_patch_v2"]},
        offline_constraints=["Pode estar desatualizado vs servidor"],
    )
