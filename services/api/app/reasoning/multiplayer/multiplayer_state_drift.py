"""Drift de estado multiplayer (heurística)."""

from __future__ import annotations


def multiplayer_drift_flags(prev_hash: str, next_hash: str) -> dict[str, object]:
    return {"drift": prev_hash != next_hash, "prev_hash": prev_hash, "next_hash": next_hash}
