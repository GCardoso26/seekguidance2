"""Linha do tempo de eventos de partida."""

from __future__ import annotations

from typing import Any


def append_event(timeline: list[dict[str, Any]], name: str, detail: str) -> None:
    timeline.append({"event": name, "detail": detail})
