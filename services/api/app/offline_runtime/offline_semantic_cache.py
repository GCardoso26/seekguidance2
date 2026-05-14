"""Cache semântico offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_semantic_cache_stub(entries: int) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"entries": entries},
        sync_hints=["TTL curto em torneio para evitar staleness."],
        deterministic_alignment={"cache_gen": "osc-v0"},
        mobile_constraints={"max_mb": 48},
        offline_confidence=0.65,
        assistant_notes=["Soft normalization obrigatória; sem colapsar TCGs."],
        lineage_replay_slice="osc-v0",
        offline_limitations=["Pode faltar patch recente de regras"],
        sync_conflicts=[],
        replay_alignment={"staleness_risk": "low"},
    )
