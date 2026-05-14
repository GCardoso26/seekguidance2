"""Diff entre snapshots."""

from __future__ import annotations

from typing import Any


def snapshot_diff(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    changes: list[str] = []
    if before.get("hash") != after.get("hash"):
        changes.append("semantic_hash_changed")
    if before.get("zone_signature") != after.get("zone_signature"):
        changes.append("zones_changed")
    return changes
