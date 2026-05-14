"""Alinhamento de replay móvel sob governança v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_alignment_governance_stub(slice_id: str) -> dict[str, Any]:
    return {
        "slice_id": slice_id,
        "assistant_notes": [
            "Alinhamento cross-runtime com prova mínima de lineage.",
            "Explainability-first: diff de eventos, não só hash.",
        ],
        "replay_summary": {"aligned": True, "drift": "none"},
        "deterministic_alignment": {"token": f"mrag-{slice_id}"},
        "lineage_replay_awareness": {"governance": "replay_governance_v2"},
    }
