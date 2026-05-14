"""replay_snapshot_lineage — reconciliação real de replay (stub operacional)."""

from __future__ import annotations

from typing import Any


def replay_snapshot_lineage_stub(replay_id: str) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "assistant_notes": [
            "Reconciliação explainability-first; merge assistido para juiz humano.",
            "Sem equivalência forte entre TCGs; soft normalization apenas.",
        ],
        "reconciliation_notes": ["Verificar heads e journal antes de merge."],
        "replay_confidence": 0.74,
        "deterministic_repair_hints": ["replay_hash_chain", "ordered_event_merge"],
        "replay_consensus_summary": {"peers": 1, "agreed": True},
        "replay_summary": {"layer": "replay_snapshot_lineage", "status": "reconciled_stub"},
        "lineage_replay_awareness": {"slice": f"repl-{replay_id}"},
    }
