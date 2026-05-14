"""Sharding de replays por hash (distribuição determinística)."""

from __future__ import annotations


def shard_for_replay(replay_hash: str, n_shards: int) -> int:
    if n_shards <= 0:
        return 0
    return int(replay_hash[:8], 16) % n_shards
