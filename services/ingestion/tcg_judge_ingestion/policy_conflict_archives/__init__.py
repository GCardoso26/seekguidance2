"""Arquivos de conflitos de política."""

from __future__ import annotations

from typing import Any


def policy_conflict_archive_stub(conflict_id: str) -> dict[str, Any]:
    return {
        "conflict_id": conflict_id,
        "contradiction_tracking": True,
        "semantic_contradiction_lineage": ["edge_stub"],
        "assistant_notes": ["Conflitos exigem supersession temporal explícita."],
    }
