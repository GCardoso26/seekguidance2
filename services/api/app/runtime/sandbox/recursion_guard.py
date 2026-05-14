"""Guarda de profundidade de recursão."""

from __future__ import annotations


class RecursionGuard:
    def __init__(self, *, max_depth: int = 64) -> None:
        self.max_depth = max_depth
        self._depth = 0

    def enter(self) -> bool:
        if self._depth >= self.max_depth:
            return False
        self._depth += 1
        return True

    def exit(self) -> None:
        self._depth = max(0, self._depth - 1)
