"""Indexação temporal de memória."""

from __future__ import annotations

from typing import Any


def build_temporal_index(entries: list[dict[str, Any]]) -> dict[str, list[int]]:
    out: dict[str, list[int]] = {}
    for i, e in enumerate(entries):
        key = str(e.get("period", "unknown"))
        out.setdefault(key, []).append(i)
    return out
