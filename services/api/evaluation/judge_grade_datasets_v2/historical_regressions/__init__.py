"""Snapshots e lineage de regressões históricas."""

from __future__ import annotations

from typing import Any


def historical_benchmark_lineage_stub(snapshot_ids: list[str]) -> dict[str, Any]:
    return {
        "snapshots": snapshot_ids,
        "lineage_depth": len(snapshot_ids),
        "assistant_notes": ["Comparar versões de política com supersession temporal explícita."],
    }
