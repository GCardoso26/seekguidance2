"""Merge determinístico de ramos equivalentes (por hash de estado)."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.replay_hashing import deterministic_hash


def merge_equivalent_branches(states: list[dict[str, Any]]) -> dict[str, Any]:
    buckets: dict[str, dict[str, Any]] = {}
    for s in states:
        h = deterministic_hash(s)
        buckets.setdefault(h, s)
    return {"unique": len(buckets), "representatives": [buckets[k] for k in sorted(buckets)]}
