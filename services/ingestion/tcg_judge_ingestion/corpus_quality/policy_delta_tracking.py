"""Tracking de deltas de política (placeholder versionado)."""

from __future__ import annotations


def policy_delta_stub(old_hash: str, new_hash: str) -> dict[str, object]:
    return {"changed": old_hash != new_hash, "old_hash": old_hash, "new_hash": new_hash}
