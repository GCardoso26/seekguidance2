"""Replay compacto no edge (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_replay_runtime_stub(replay_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"replay_id": replay_id, "chunks": 2, "lazy": True},
        sync_hints=["Carregar chunk seguinte só após confirmação de integridade."],
        deterministic_alignment={"resume": True},
        mobile_constraints={"chunk_cap": 10},
        offline_confidence=0.7,
        assistant_notes=["Determinismo por ordem de eventos no slice materializado."],
        lineage_replay_slice=f"edge-replay-{replay_id}",
        extras={
            "edge_constraints": {"storage_mb_soft": 128},
            "replay_compaction": {"ratio": 0.35},
            "deterministic_limits": {"max_parallel_branches": 4},
            "sync_expectations": ["upload_replay_delta_when_queue_ok"],
        },
    )
