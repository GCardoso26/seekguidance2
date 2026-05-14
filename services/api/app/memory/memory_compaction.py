"""Compactação de snapshots semânticos."""

from __future__ import annotations

from typing import Any


def compact_memory(entries: list[dict[str, Any]], keep_last: int = 128) -> list[dict[str, Any]]:
    k = max(1, keep_last)
    return list(entries[-k:])
