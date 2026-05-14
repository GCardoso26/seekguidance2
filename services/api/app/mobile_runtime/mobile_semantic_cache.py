"""Cache semântico local (ontologia/policy) — stub."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_semantic_cache_stub(entries: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"cached_entries": entries, "ttl_s": 3600},
        sync_hints=["Invalidar cache após patch de política.", "Preferir snapshots assinados."],
        deterministic_alignment={"cache_version": "sem-v0"},
        mobile_constraints={"max_mb": 32},
        offline_confidence=0.66,
        assistant_notes=["Cache local acelera consultas; não substitui lineage completo no servidor."],
        lineage_replay_slice="semantic-cache-v0",
    )
