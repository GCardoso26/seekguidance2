"""Dispara handlers simbólicos (sem side-effects reais)."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from app.reasoning.events.gameplay_events import GameplayEvent

Handler = Callable[[GameplayEvent], dict[str, Any]]


class EventDispatcher:
    def __init__(self) -> None:
        self._handlers: dict[str, Handler] = {}

    def register(self, event_name_prefix: str, fn: Handler) -> None:
        self._handlers[event_name_prefix] = fn

    def dispatch(self, ev: GameplayEvent) -> dict[str, Any]:
        for prefix, fn in self._handlers.items():
            if ev.name.startswith(prefix):
                return fn(ev)
        return {"handled": False, "event": ev.name}
