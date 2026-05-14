"""Particionamento de estado por mesa/sessão."""

from __future__ import annotations


def partition_key(session_id: str, game_slug: str) -> str:
    return f"{game_slug}:{session_id}"
