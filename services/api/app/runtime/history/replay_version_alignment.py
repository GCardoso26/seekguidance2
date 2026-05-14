"""Alinhamento de replay por versão."""

from __future__ import annotations


def align_replay_versions(historical_hashes: list[str], current_hash: str) -> dict[str, object]:
    return {"historical_replays_compared": historical_hashes, "aligned": current_hash in historical_hashes}
