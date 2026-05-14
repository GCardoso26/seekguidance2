"""Alinhamento temporal offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_temporal_alignment_stub(tcg: str) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"tcg": tcg, "ticks": 80},
        sync_hints=["Reconciliar relógios de jogadores ao voltar online."],
        deterministic_alignment={"ordering": "stable-offline"},
        mobile_constraints={"max_players_tracked": 6},
        offline_confidence=0.54,
        assistant_notes=["Timing por TCG; sem equivalência forte cross-TCG."],
        lineage_replay_slice=f"otemp-{tcg}",
        offline_limitations=["Relógios locais podem divergir levemente"],
        sync_conflicts=[],
        replay_alignment={"drift_ms_est": 0},
    )
