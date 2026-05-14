"""Linha do tempo de prioridade."""

from __future__ import annotations


def priority_events(players: list[str]) -> list[dict[str, str]]:
    return [{"player": p, "window": "open"} for p in players]
