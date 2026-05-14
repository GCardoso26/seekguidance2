"""Governança offline (políticas de sync e replay) — stub."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_governance_stub(tier: str) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"tier": tier, "explainability": "mandatory"},
        sync_hints=["Registrar violações locais para revisão de juiz head."],
        deterministic_alignment={"policy": f"og-{tier}"},
        mobile_constraints={"strict_mode": tier == "tournament"},
        offline_confidence=0.63,
        assistant_notes=["Governança offline espelha princípios replay_governance_v2."],
        lineage_replay_slice="og-v0",
        offline_limitations=["Sem enforcement remoto imediato"],
        sync_conflicts=[],
        replay_alignment={"local_policy_version": 1},
    )
