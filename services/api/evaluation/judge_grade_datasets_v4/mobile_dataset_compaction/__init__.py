"""Compactação de datasets móveis (stub)."""

from __future__ import annotations

from typing import Any


def mobile_dataset_compaction_stub(rows: int, target: int) -> dict[str, Any]:
    return {
        "rows": rows,
        "target": target,
        "removed": max(0, rows - target),
        "replay_summary": {"compacted_rows": target},
        "assistant_notes": ["Compactação documenta colunas removidas no manifesto."],
        "sync_hints": ["Enviar manifesto compacto + prova mínima."],
        "deterministic_alignment": {"order": "stable"},
        "mobile_constraints": {"target_rows": target},
        "offline_confidence": 0.58,
        "lineage_replay_awareness": {"slice": "mdc-v0"},
    }
