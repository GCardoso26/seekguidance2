"""replay_runtime_health — wiring operacional sobre repositórios existentes (sem DB pesado)."""

from __future__ import annotations

from typing import Any

from app.runtime.persistent_replay_runtime.replay_consistency_storage import replay_consistency_persist_stub
from app.runtime.persistent_replay_runtime.replay_governance_storage import replay_governance_persist_stub
from app.runtime.persistent_replay_runtime.replay_integrity_repository import replay_integrity_record_stub
from app.runtime.persistent_replay_runtime.replay_snapshot_repository import replay_snapshot_put_stub


def replay_runtime_health_stub(replay_ref: str) -> dict[str, Any]:
    snap = replay_integrity_record_stub(replay_ref)
    lin = replay_consistency_persist_stub(replay_ref, lineage=snap.get("lineage", {}))
    rec = replay_governance_persist_stub(replay_ref)
    integ = replay_snapshot_put_stub(replay_ref)
    name = "replay_runtime_health"

    return {
        "replay_runtime_summary": {"replay_ref": replay_ref, "layer": name},
        "lineage_runtime_summary": {"anchors": lin.get("lineage", {}), "merged": True},
        "reconciliation_summary": {
            "status": rec.get("replay_ref"),
            "notes": (rec.get("assistant_notes") or [])[:1],
        },
        "replay_health_summary": {"integrity": integ.get("runtime_confidence", 0.7) > 0.5},
        "deterministic_replay_alignment": {
            "token": f"drs-{replay_ref}",
            "dialect": snap.get("storage_dialect"),
        },
        "assistant_notes": [
            f"{name}: wiring operacional incremental; reasoning_v1…v11 inalterados.",
            "Soft normalization apenas; explainability-first.",
        ],
    }
