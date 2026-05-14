"""Store in-memory para memória semântica temporal."""

from __future__ import annotations

from typing import Any


class SemanticMemoryStore:
    def __init__(self, *, max_entries: int = 512) -> None:
        self.max_entries = max_entries
        self._data: list[dict[str, Any]] = []

    def append(self, item: dict[str, Any]) -> None:
        self._data.append(dict(item))
        if len(self._data) > self.max_entries:
            self._data = self._data[-self.max_entries :]

    def all(self) -> list[dict[str, Any]]:
        return list(self._data)
