"""Governança de retenção/pruning de storage móvel (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def mobile_storage_governance_stub(tier: str) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"tier": tier, "retention_days_soft": 7 if tier == "casual" else 2},
        sync_hints=["Arquivar slices antigos antes de delete físico."],
        deterministic_alignment={"policy": f"msg-{tier}"},
        mobile_constraints={"prune_aggressive": tier == "tournament"},
        offline_confidence=0.65,
        assistant_notes=["Pruning local não apaga prova exigida por disputa aberta."],
        lineage_replay_slice="msg-v0",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"governed": True},
        integrity_status={"audit_tail": "present"},
        replay_alignment={"pinned_slices": 1},
        lineage_snapshot={"retention_policy": tier},
        offline_constraints=["Head juiz pode fixar retenção extendida"],
    )
