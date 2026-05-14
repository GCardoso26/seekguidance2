"""Gestão de sessões independentes."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_context import RuntimeContext


class RuntimeSessionManager:
    def __init__(self) -> None:
        self._sessions: dict[str, RuntimeContext] = {}

    def create(self, session_id: str, game_slug: str, caps: dict[str, int] | None = None) -> RuntimeContext:
        ctx = RuntimeContext(session_id=session_id, game_slug=game_slug, caps=dict(caps or {}))
        self._sessions[session_id] = ctx
        return ctx

    def get(self, session_id: str) -> RuntimeContext | None:
        return self._sessions.get(session_id)

    def drop(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

    def stats(self) -> dict[str, Any]:
        return {"active_sessions": len(self._sessions)}
