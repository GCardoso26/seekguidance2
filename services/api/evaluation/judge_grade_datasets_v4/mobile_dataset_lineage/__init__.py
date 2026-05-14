"""Lineage de dataset móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_dataset_lineage_stub(root: str) -> dict[str, Any]:
    return {
        "root": root,
        "assistant_notes": ["Lineage local parcial; servidor pode ter grafo completo."],
        "lineage_snapshot": {"depth": 3},
        "replay_summary": {"nodes": 5},
        "deterministic_alignment": {"token": f"mdl-{root}"},
    }
