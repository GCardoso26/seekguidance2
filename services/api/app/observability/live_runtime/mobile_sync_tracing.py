"""Tracing de sync móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_sync_tracing_stub(op_id: str) -> dict[str, Any]:
    return {
        "op_id": op_id,
        "assistant_notes": ["Correlacionar op_id com replay_slice para disputas."],
        "replay_summary": {"ops_traced": 1},
        "deterministic_alignment": {"idempotent": True},
        "lineage_replay_awareness": {"slice": "mst-v2"},
    }
