"""Resolução em lote de eventos simbólicos."""

from __future__ import annotations

from typing import Any

from app.reasoning.events.event_dispatcher import EventDispatcher
from app.reasoning.events.event_queue import EventQueue


def resolve_event_batch(queue: EventQueue, dispatcher: EventDispatcher, *, batch: int = 8) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for ev in queue.pop_batch(batch):
        results.append(dispatcher.dispatch(ev))
    return results
