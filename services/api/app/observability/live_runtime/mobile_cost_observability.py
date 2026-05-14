"""Custo operacional e dados móveis (stub)."""

from __future__ import annotations

from typing import Any


def mobile_cost_observability_stub(bytes_sent: int) -> dict[str, Any]:
    return {
        "bytes_sent": bytes_sent,
        "replay_summary": {"compression": "zstd-preferred"},
        "assistant_notes": ["Custos são estimativas locais; cloud continua opcional."],
        "sync_hints": ["Evitar payloads verbose; usar semantic snapshots."],
        "deterministic_alignment": {"accounting": "per-session"},
        "mobile_constraints": {"daily_quota_soft_mb": 80},
        "offline_confidence": 0.48,
        "lineage_replay_awareness": {"slice": "mco-v0"},
    }
