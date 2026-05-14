"""Sincronização incremental priorizada (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def incremental_sync_runtime_stub(pending: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"pending_ops": pending, "last_merge": "none"},
        sync_hints=["replay_deltas", "ruling_cache", "ontology_patch"],
        deterministic_alignment={"merge_policy": "lexicographic_device_then_server"},
        mobile_constraints={"bandwidth_class": "low", "batch_max_kb": 64},
        offline_confidence=0.55,
        assistant_notes=[
            "Conflitos: assistência ao juiz; sem auto-merge silencioso de ruling.",
        ],
        lineage_replay_slice="sync-priority-v0",
        extras={"sync_queue_depth": pending},
    )
