"""Janela determinística de eventos de replay."""

from __future__ import annotations

from typing import Any


def clip_replay_window(events: list[dict[str, Any]], *, start: int, end: int) -> list[dict[str, Any]]:
    return events[max(0, start) : max(start, end)]
