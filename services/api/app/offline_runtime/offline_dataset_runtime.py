"""Dataset runtime offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_dataset_runtime_stub(name: str) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"dataset": name, "rows": 120},
        sync_hints=["Checksum incremental antes de aplicar."],
        deterministic_alignment={"manifest": f"ods-{name}"},
        mobile_constraints={"storage_mb": 96},
        offline_confidence=0.59,
        assistant_notes=["Subconjunto judge-grade; lineage completo pode estar na cloud."],
        lineage_replay_slice=f"ods-{name}",
        offline_limitations=["Cobertura parcial de corner cases"],
        sync_conflicts=[],
        replay_alignment={"integrity": "pending_remote"},
    )
