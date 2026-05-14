"""Delta sync operacional (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def delta_sync_runtime_stub(cursor: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"cursor": cursor, "deltas_pending": 2},
        sync_hints=["Aplicar deltas em ordem lexicográfica de (slice_id, seq)."],
        deterministic_alignment={"cursor_next": f"{cursor}+1"},
        mobile_constraints={"max_batch_ops": 64},
        offline_confidence=0.66,
        assistant_notes=["Merge determinístico; conflitos explicáveis ao juiz."],
        lineage_replay_slice="delta-v0",
        extras={
            "sync_confidence": 0.72,
            "replay_delta_summary": {"ops": 2, "bytes": 1200},
            "conflict_resolution_notes": [],
            "deterministic_merge_hints": ["ordered_by_slice_then_seq"],
        },
    )
