"""Recuperação de runtime / reconstrução determinística."""

from __future__ import annotations

from typing import Any


def deterministic_replay_reconstruct_stub(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(events, key=lambda e: (e.get("tick", 0), str(e)))
