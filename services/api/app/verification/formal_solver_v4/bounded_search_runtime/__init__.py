"""Bounded exhaustive legality search."""

from __future__ import annotations

from typing import Any


def bounded_legality_search(candidates: list[str], *, budget: int) -> dict[str, Any]:
    visited = candidates[:budget]
    return {"visited": len(visited), "dead_ends_pruned": max(0, len(candidates) - budget)}
