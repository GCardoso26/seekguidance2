"""Observabilidade de sincronização móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_sync_observability_stub(pending: int) -> dict[str, Any]:
    return {
        "pending_ops": pending,
        "replay_summary": {"last_sync_age_s": 120},
        "assistant_notes": ["Conflitos: sempre painel explicável para o juiz."],
        "sync_hints": ["Priorizar replay_deltas sobre analytics."],
        "deterministic_alignment": {"merge_log": "ordered-v0"},
        "mobile_constraints": {"max_payload_kb": 64},
        "offline_confidence": 0.5,
        "lineage_replay_awareness": {"slice": "mso-v0"},
        "conflict_hotspots": [],
    }
