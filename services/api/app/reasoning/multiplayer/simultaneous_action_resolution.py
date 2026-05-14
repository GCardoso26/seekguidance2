"""Resolução de ações simultâneas (delega ao runtime multiplayer existente)."""

from __future__ import annotations

from typing import Any

from app.multiplayer.simultaneous_action_resolution import resolve_simultaneous


def resolve_simultaneous_actions(actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return resolve_simultaneous(actions)
