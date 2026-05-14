"""Equivalência fraca de ramos."""

from __future__ import annotations

from typing import Any


def branch_equivalence_runtime_stub(groups: int) -> dict[str, Any]:
    return {
        "groups": groups,
        "branch_collapse_explainability": f"{groups} grupos equivalentes fracos.",
        "assistant_notes": ["Nunca equivalência forte cross-TCG."],
    }
