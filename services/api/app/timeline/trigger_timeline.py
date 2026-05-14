"""Linha do tempo de triggers."""

from __future__ import annotations


def trigger_events(labels: list[str]) -> list[dict[str, str]]:
    return [{"trigger": t, "status": "pending"} for t in labels]
