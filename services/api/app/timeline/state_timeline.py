"""Linha do tempo de estados."""

from __future__ import annotations


def state_events(states: list[str]) -> list[dict[str, str]]:
    return [{"state": s} for s in states]
