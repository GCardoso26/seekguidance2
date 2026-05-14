"""Sincronização incremental móvel (prioridade e reconciliação — stub)."""

from __future__ import annotations

from typing import Any


def incremental_sync_plan_stub(pending: int) -> dict[str, Any]:
    return {
        "pending_ops": pending,
        "priority": ["replay_deltas", "ruling_cache", "ontology_patch"],
        "assistant_notes": ["Sync por prioridade; conflitos assistidos para juiz humano."],
    }
