"""Deteção de conflitos entre rulings (mesmo id, conclusões diferentes)."""

from __future__ import annotations

from typing import Any


def ruling_conflict_detection(rulings: list[dict[str, Any]]) -> list[str]:
    by_id: dict[str, str] = {}
    conflicts: list[str] = []
    for r in rulings:
        rid = str(r.get("id", ""))
        concl = str(r.get("conclusion", ""))
        if not rid:
            continue
        if rid in by_id and by_id[rid] != concl:
            conflicts.append(rid)
        else:
            by_id[rid] = concl
    return sorted(set(conflicts))
