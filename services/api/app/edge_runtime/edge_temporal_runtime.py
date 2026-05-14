"""Temporal no edge (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_temporal_runtime_stub(tcg: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"tcg": tcg, "ticks": 60},
        sync_hints=["Sem equivalência forte entre TCGs; soft normalization apenas."],
        deterministic_alignment={"ordering": "stable-edge"},
        mobile_constraints={"degrade_on_thermal": True},
        offline_confidence=0.52,
        assistant_notes=["Timing simplificado; validação completa pode ser cloud opcional."],
        lineage_replay_slice=f"edge-temp-{tcg}",
        extras={
            "edge_constraints": {"max_players": 6},
            "replay_compaction": {"timeline_window": 60},
            "deterministic_limits": {"tick_cap": 200},
            "sync_expectations": ["reconcile_clocks_when_online"],
        },
    )
