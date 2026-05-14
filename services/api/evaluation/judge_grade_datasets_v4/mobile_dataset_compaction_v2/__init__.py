"""Compactação v2 de datasets móveis (stub)."""

from __future__ import annotations

from typing import Any


def mobile_dataset_compaction_v2_stub(rows: int, target: int) -> dict[str, Any]:
    return {
        "rows": rows,
        "target": target,
        "removed": max(0, rows - target),
        "assistant_notes": ["v2 documenta colunas removidas no manifesto incremental."],
        "replay_summary": {"compacted": True},
        "deterministic_alignment": {"order": "stable"},
    }
