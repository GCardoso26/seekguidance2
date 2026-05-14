"""Degradação do edge (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_runtime_degradation_stub(level: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"level": level},
        sync_hints=["Escalar nível com thermal + fila de sync."],
        deterministic_alignment={"deg_token": f"erd-{level}"},
        mobile_constraints={"reduce_branch_exploration": level > 1},
        offline_confidence=max(0.25, 0.75 - 0.12 * level),
        assistant_notes=["Degradação não altera eventos já persistidos."],
        lineage_replay_slice="erd-v0",
        extras={
            "edge_constraints": {"level": level},
            "replay_compaction": {"stronger": level > 2},
            "deterministic_limits": {"depth_cap": max(3, 8 - level)},
            "sync_expectations": ["pause_background_sync_when_level_high"],
        },
    )
