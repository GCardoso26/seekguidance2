"""Fila de eventos limitada (determinística)."""

from __future__ import annotations

from collections import deque
from typing import Any


class RuntimeQueue:
    def __init__(self, *, max_size: int = 256) -> None:
        self._max = max_size
        self._q: deque[dict[str, Any]] = deque()

    def push(self, item: dict[str, Any]) -> bool:
        if len(self._q) >= self._max:
            return False
        self._q.append(item)
        return True

    def drain(self) -> list[dict[str, Any]]:
        out = list(self._q)
        self._q.clear()
        return out

    def __len__(self) -> int:
        return len(self._q)
