"""Rastreio simbólico de stack (MTG-like)."""

from __future__ import annotations

from typing import Any


class StackTracker:
    def __init__(self) -> None:
        self._items: list[dict[str, Any]] = []

    def push(self, item: dict[str, Any]) -> None:
        self._items.append(dict(item))

    def snapshot(self) -> list[dict[str, Any]]:
        return [dict(x) for x in self._items]
