"""Eventos atrasados (fila separada, bounded)."""

from __future__ import annotations

from collections import deque

from app.reasoning.events.gameplay_events import GameplayEvent

MAX_DELAYED = 16


class DelayedEventQueue:
    def __init__(self) -> None:
        self._d: deque[GameplayEvent] = deque()

    def schedule(self, ev: GameplayEvent) -> bool:
        if len(self._d) >= MAX_DELAYED:
            return False
        self._d.append(ev)
        return True

    def due(self) -> list[GameplayEvent]:
        return list(self._d)[:8]
