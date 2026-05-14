"""Adaptador de estado semântico orientado a Postgres (backend in-process por defeito)."""

from __future__ import annotations

from typing import Any

from app.distributed_state.semantic_state_store import SemanticStateStore


class SemanticPostgresStore:
    """Fachada para futura ligação asyncpg; delega num `SemanticStateStore` local."""

    def __init__(self, inner: SemanticStateStore | None = None) -> None:
        self._inner = inner or SemanticStateStore()

    def append_transition(
        self, *, session_id: str, game_slug: str, state: dict[str, Any], chain: dict[str, str]
    ) -> dict[str, Any]:
        return self._inner.append_transition(
            session_id=session_id, game_slug=game_slug, state=state, chain=chain
        )

    def latest(self, session_id: str, game_slug: str) -> dict[str, Any] | None:
        return self._inner.latest(session_id, game_slug)

    def verify_chain(self, session_id: str, game_slug: str) -> bool:
        return self._inner.verify_chain(session_id, game_slug)
