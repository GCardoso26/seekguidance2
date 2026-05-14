"""Transporte de replay delta (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def replay_delta_transport_stub(replay_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"replay_id": replay_id, "encoding": "compact-v1"},
        sync_hints=["Comprimir com orçamento CPU/bateria.", "ACK após persistência fsync."],
        deterministic_alignment={"transport_token": f"rdt-{replay_id}"},
        mobile_constraints={"max_payload_kb": 96},
        offline_confidence=0.61,
        assistant_notes=["Transporte não altera semântica dos eventos; só embalagem."],
        lineage_replay_slice=f"rdt-{replay_id}",
        extras={
            "sync_confidence": 0.64,
            "replay_delta_summary": {"chunks": 1},
            "conflict_resolution_notes": ["Nenhum conflito em stub"],
            "deterministic_merge_hints": ["verify_hash_chain"],
        },
    )
