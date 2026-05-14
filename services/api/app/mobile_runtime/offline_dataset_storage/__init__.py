"""Armazenamento de datasets offline (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def offline_dataset_storage_stub(dataset_id: str) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"dataset_id": dataset_id, "rows": 500},
        sync_hints=["Aplicar delta só com manifesto assinado."],
        deterministic_alignment={"manifest": f"ods-{dataset_id}"},
        mobile_constraints={"quota_mb_soft": 128},
        offline_confidence=0.58,
        assistant_notes=["Subconjunto judge-grade; cobertura parcial possível."],
        lineage_replay_slice=f"ods-store-{dataset_id}",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"mounted": True},
        integrity_status={"row_count_ok": True},
        replay_alignment={"last_apply_cursor": "c0"},
        lineage_snapshot={"dataset_lineage_id": dataset_id},
        offline_constraints=["Sem solver pesado embutido"],
    )
