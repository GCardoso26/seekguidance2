"""Histórico append-only de mutações."""

from __future__ import annotations

from typing import Any


class MutationHistory:
    def __init__(self) -> None:
        self.entries: list[dict[str, Any]] = []

    def record(self, item: dict[str, Any]) -> None:
        self.entries.append(item)

    def last_n(self, n: int) -> list[dict[str, Any]]:
        return self.entries[-n:] if n > 0 else []
