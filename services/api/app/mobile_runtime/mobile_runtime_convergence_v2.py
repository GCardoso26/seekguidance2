"""Convergência v2 do runtime móvel (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_runtime_convergence_v2_stub(level: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"level": level, "stable": level <= 2},
        sync_hints=["Escalar nível com fila e thermal."],
        deterministic_alignment={"token": f"mrcv2m-{level}"},
        mobile_constraints={"max_branch_depth": 8 - level},
        offline_confidence=max(0.3, 0.75 - 0.1 * level),
        assistant_notes=["Convergência móvel cooperante com explosion_control v5/v6."],
        lineage_replay_slice="mrcv2m",
    )
