"""Conflitos de recursos partilhados (flags)."""

from __future__ import annotations

from typing import Any


def shared_resource_conflict_flags(claims: list[dict[str, Any]]) -> dict[str, Any]:
    owners: dict[str, str] = {}
    conflicts: list[str] = []
    for c in claims:
        rid = str(c.get("resource_id", ""))
        who = str(c.get("player", ""))
        if not rid:
            continue
        if rid in owners and owners[rid] != who:
            conflicts.append(rid)
        owners.setdefault(rid, who)
    return {"conflicts": sorted(set(conflicts)), "ok": not conflicts}
