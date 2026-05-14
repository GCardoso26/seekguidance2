"""Replay offline parcial com continuação determinística (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def offline_replay_runtime_stub(replay_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"replay_id": replay_id, "chunks_loaded": 3, "lazy": True},
        sync_hints=["Carregar próximo chunk sob pressão de memória.", "Reconciliar com arquivo cloud quando online."],
        deterministic_alignment={"resume": True, "slice_hash": f"off-{replay_id}"},
        mobile_constraints={"low_memory_mode": True, "chunk_cap": 8},
        offline_confidence=0.71,
        assistant_notes=[
            "Replay local: mesma ordem de eventos por slice; governança replay_governance_v2.",
        ],
        lineage_replay_slice=f"off-replay-{replay_id}",
        extras={"replay_governance": "deterministic_resume_supported"},
    )
