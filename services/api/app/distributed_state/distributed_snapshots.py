"""Snapshots distribuídos com cadeia de hashes."""

from __future__ import annotations

from typing import Any

from app.distributed_state.deterministic_state_hashing import semantic_checksum, state_hash, transition_hash


def build_snapshot_chain(
    *,
    parent_state_hash: str,
    state: dict[str, Any],
    transition: dict[str, Any],
    semantic_slice: dict[str, Any],
) -> dict[str, str]:
    sh = state_hash(state)
    th = transition_hash(parent_state_hash, transition)
    sc = semantic_checksum(semantic_slice)
    return {
        "state_hash": sh,
        "parent_state_hash": parent_state_hash,
        "transition_hash": th,
        "semantic_checksum": sc,
    }
