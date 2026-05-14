"""Dataset no edge (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_dataset_runtime_stub(dataset_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"dataset_id": dataset_id, "rows": 300},
        sync_hints=["Aplicar manifesto incremental somente com hash OK."],
        deterministic_alignment={"manifest": f"ed-{dataset_id}"},
        mobile_constraints={"quota_mb": 96},
        offline_confidence=0.59,
        assistant_notes=["Execução local de subconjunto; lineage judge-grade no servidor."],
        lineage_replay_slice=f"edge-ds-{dataset_id}",
        extras={
            "edge_constraints": {"verify_each_batch": True},
            "replay_compaction": {"strip_verbose_columns": True},
            "deterministic_limits": {"stable_row_order": True},
            "sync_expectations": ["delta_dataset_patch"],
        },
    )
