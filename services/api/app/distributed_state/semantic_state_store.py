"""Armazenamento de estado semântico (interface + backend in-process).

Em produção, substituir backend por Postgres/Redis via `persistence/`.
"""

from __future__ import annotations

from typing import Any

from app.distributed_state.deterministic_state_hashing import state_hash
from app.distributed_state.state_partitioning import partition_key


class SemanticStateStore:
    def __init__(self) -> None:
        self._by_partition: dict[str, list[dict[str, Any]]] = {}

    def append_transition(
        self,
        *,
        session_id: str,
        game_slug: str,
        state: dict[str, Any],
        chain: dict[str, str],
    ) -> dict[str, Any]:
        pk = partition_key(session_id, game_slug)
        entry = {
            "partition": pk,
            "state_hash": chain["state_hash"],
            "parent_state_hash": chain["parent_state_hash"],
            "transition_hash": chain["transition_hash"],
            "semantic_checksum": chain["semantic_checksum"],
            "state_snapshot": dict(state),
        }
        self._by_partition.setdefault(pk, []).append(entry)
        return entry

    def latest(self, session_id: str, game_slug: str) -> dict[str, Any] | None:
        pk = partition_key(session_id, game_slug)
        rows = self._by_partition.get(pk)
        return rows[-1] if rows else None

    def verify_chain(self, session_id: str, game_slug: str) -> bool:
        pk = partition_key(session_id, game_slug)
        rows = self._by_partition.get(pk) or []
        prev = ""
        for r in rows:
            if r["state_hash"] != state_hash(r["state_snapshot"]):
                return False
            if prev and r["parent_state_hash"] != prev:
                return False
            prev = r["state_hash"]
        return True
