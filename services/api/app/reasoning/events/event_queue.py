"""Fila de eventos com limite (anti-explosão)."""

from __future__ import annotations

from collections import deque

from app.reasoning.events.gameplay_events import GameplayEvent

MAX_QUEUE = 48


class EventQueue:
    def __init__(self, *, max_size: int = MAX_QUEUE) -> None:
        self._q: deque[GameplayEvent] = deque()
        self._max = max_size

    def push(self, ev: GameplayEvent) -> bool:
        if len(self._q) >= self._max:
            return False
        self._q.append(ev)
        return True

    def pop_batch(self, n: int = 8) -> list[GameplayEvent]:
        out: list[GameplayEvent] = []
        while self._q and len(out) < n:
            out.append(self._q.popleft())
        return out

    def __len__(self) -> int:
        return len(self._q)
