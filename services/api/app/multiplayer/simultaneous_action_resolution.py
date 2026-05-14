"""Resolução de ações simultâneas (stub determinístico)."""

from __future__ import annotations

from typing import Any


def resolve_simultaneous(actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(actions, key=lambda a: str(a.get("player", "")))
