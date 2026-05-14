"""Consistência distribuída de replay."""

from __future__ import annotations

from typing import Any


def distributed_replay_consistency_stub(shards: list[str]) -> dict[str, Any]:
    return {"shards": len(shards), "unique_hashes": len(set(shards)), "consistent": len(set(shards)) <= 1}
