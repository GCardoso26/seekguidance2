"""Limites de custo/recursos no edge (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_runtime_limits_stub(mem_pct: float) -> dict[str, Any]:
    tight = mem_pct > 0.85
    return judge_mobile_core_payload(
        replay_summary={"mem_pct": mem_pct, "tight": tight},
        sync_hints=["Pausar prefetch se tight."],
        deterministic_alignment={"limits_token": "erl-v0"},
        mobile_constraints={"throttle": tight},
        offline_confidence=0.5 if tight else 0.72,
        assistant_notes=["Limites preservam ordem lógica; apenas throughput muda."],
        lineage_replay_slice="erl-v0",
        extras={
            "edge_constraints": {"mem_pct": mem_pct},
            "replay_compaction": {"aggressive": tight},
            "deterministic_limits": {"entropy_cap_soft": 0.3 if tight else 0.45},
            "sync_expectations": ["defer_non_critical_sync"],
        },
    )
