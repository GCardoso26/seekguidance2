"""Histórico linear de transições (cap)."""

from __future__ import annotations

from typing import Any

MAX_HISTORY = 64


class TransitionHistory:
    def __init__(self) -> None:
        self._items: list[dict[str, Any]] = []

    def append(self, item: dict[str, Any]) -> None:
        self._items.append(item)
        if len(self._items) > MAX_HISTORY:
            self._items = self._items[-MAX_HISTORY:]

    def as_list(self) -> list[dict[str, Any]]:
        return list(self._items)
