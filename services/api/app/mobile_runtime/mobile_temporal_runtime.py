"""Alinhamento temporal compacto para edge (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_temporal_runtime_stub(tcg: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"tcg": tcg, "timeline_ticks": 120, "compressed": True},
        sync_hints=["Não assumir equivalência de fases entre TCGs.", "Usar soft normalization apenas."],
        deterministic_alignment={"tick_ordering": "stable", "branch_tag": f"tmp-{tcg}"},
        mobile_constraints={"max_parallel_branches": 4},
        offline_confidence=0.58,
        assistant_notes=[
            "Timing simplificado no edge; validação completa pode exigir cloud.",
        ],
        lineage_replay_slice=f"temporal-{tcg}",
    )
