"""Governança de datasets móveis (stub)."""

from __future__ import annotations

from typing import Any


def mobile_dataset_governance_stub(tier: str) -> dict[str, Any]:
    return {
        "tier": tier,
        "replay_summary": {"policy": "explainability-first"},
        "assistant_notes": ["Governança local complementa judge_grade v4 no servidor."],
        "sync_hints": ["Torneio strict: exigir assinatura de manifesto."],
        "deterministic_alignment": {"policy_hash": f"mdg-{tier}"},
        "mobile_constraints": {"strict": tier == "tournament"},
        "offline_confidence": 0.61,
        "lineage_replay_awareness": {"slice": "mdg-v0"},
    }
