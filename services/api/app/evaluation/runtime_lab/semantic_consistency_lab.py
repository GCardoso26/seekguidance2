"""Laboratório de consistência semântica (encadeamento local)."""

from __future__ import annotations

from typing import Any

from app.distributed_state.distributed_snapshots import build_snapshot_chain
from app.distributed_state.semantic_state_store import SemanticStateStore


def run_semantic_consistency_lab() -> dict[str, Any]:
    store = SemanticStateStore()
    st = {"x": 1}
    chain = build_snapshot_chain(
        parent_state_hash="",
        state=st,
        transition={"t": 1},
        semantic_slice={"s": 1},
    )
    store.append_transition(session_id="s", game_slug="mtg", state=st, chain=chain)
    return {"verified": store.verify_chain("s", "mtg")}
