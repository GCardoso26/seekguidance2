"""Lineage de rulings com conflitos explícitos."""

from __future__ import annotations

from typing import Any


def conflict_aware_lineage_stub(edges: list[tuple[str, str, str]]) -> dict[str, Any]:
    """edges: (from_id, to_id, conflict_flag)."""
    conflicts = [e for e in edges if e[2] == "conflict"]
    return {"edges": len(edges), "conflicts": len(conflicts)}
