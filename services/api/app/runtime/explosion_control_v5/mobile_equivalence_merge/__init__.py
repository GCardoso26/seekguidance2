"""Merge de equivalências soft (sem equivalência forte entre TCGs) — stub."""

from __future__ import annotations

from typing import Any


def mobile_equivalence_merge_stub(groups: int) -> dict[str, Any]:
    return {
        "groups": groups,
        "merged": max(0, groups - 1),
        "assistant_notes": [
            "Apenas equivalências soft intra-TCG aprovadas pelo módulo de hardening.",
            "Sem colapsar semânticas entre TCGs distintos.",
        ],
        "replay_summary": {"equivalence_groups": groups},
        "sync_hints": ["Enviar prova mínima de equivalência para auditoria."],
        "deterministic_alignment": {"token": "meq-v0"},
        "mobile_constraints": {"max_groups": 16},
        "offline_confidence": 0.49,
        "lineage_replay_awareness": {"slice": "meqmerge-v0"},
    }
