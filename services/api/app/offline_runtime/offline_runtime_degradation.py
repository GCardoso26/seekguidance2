"""Degradação controlada do runtime offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_runtime_degradation_stub(level: int) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"level": level, "effects": ["lower_fps", "shorter_timeline"][: max(0, min(level, 2))]},
        sync_hints=["Logar degradação com causa raiz provável."],
        deterministic_alignment={"degrade_token": f"deg-{level}"},
        mobile_constraints={"throttle": level > 0},
        offline_confidence=max(0.2, 0.8 - 0.15 * level),
        assistant_notes=["Degradação preserva ordem lógica salva; apenas UX/throughput."],
        lineage_replay_slice="degrade-v0",
        offline_limitations=["Menos ramos explorados em níveis altos"],
        sync_conflicts=[],
        replay_alignment={"resume_safe": True},
    )
