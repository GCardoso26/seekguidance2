"""Deteção simples de conflitos entre mutações."""

from __future__ import annotations

from typing import Any


def detect_conflicts(muts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: dict[tuple[str, str], str] = {}
    conflicts: list[dict[str, Any]] = []
    for m in muts:
        key = (str(m.get("target_object", "")), str(m.get("mutation_type", "")))
        rid = str(m.get("rule_id", ""))
        if key in seen:
            conflicts.append({"first": seen[key], "second": rid, "target": key})
        else:
            seen[key] = rid
    return conflicts
