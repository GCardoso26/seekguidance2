"""Reconstrução de timeline a partir de eventos ordenados."""

from __future__ import annotations

from typing import Any


def reconstruct(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(events, key=lambda e: str(e.get("seq", 0)))
