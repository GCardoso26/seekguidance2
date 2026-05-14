"""Chunks de replay locais (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def replay_local_storage_stub(replay_id: str, chunks: int) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"replay_id": replay_id, "chunks": chunks},
        sync_hints=["Carregar próximo chunk com backpressure.", "Pausar prefetch em baixa bateria."],
        deterministic_alignment={"chunk_order": "stable"},
        mobile_constraints={"chunk_cap": 12},
        offline_confidence=0.68,
        assistant_notes=["Replay incremental; determinismo por ordem de chunk."],
        lineage_replay_slice=f"rls-{replay_id}",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"chunks_on_disk": chunks, "lazy": True},
        integrity_status={"head_hash": "stub"},
        replay_alignment={"resume_token": f"rt-{replay_id}"},
        lineage_snapshot={"events": chunks * 8},
        offline_constraints=["Explosão local limitada por explosion_control"],
    )
