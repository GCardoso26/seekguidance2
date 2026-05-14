"""Execução de replay offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_replay_execution_stub(replay_id: str) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"replay_id": replay_id, "chunks": 2},
        sync_hints=["Carregar chunk seguinte sob demanda."],
        deterministic_alignment={"resume": True},
        mobile_constraints={"chunk_cap": 8},
        offline_confidence=0.72,
        assistant_notes=["Replay determinístico por slice; governança local + servidor."],
        lineage_replay_slice=f"orex-{replay_id}",
        offline_limitations=["Timeline parcial até sync"],
        sync_conflicts=[],
        replay_alignment={"local_head": replay_id, "remote_head": None},
    )
