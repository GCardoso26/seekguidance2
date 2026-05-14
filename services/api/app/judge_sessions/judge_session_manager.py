"""Gestão de sessões de juiz (reasoning contínuo, não motor jurídico)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class JudgeSession:
    session_id: str
    game_slug: str
    table_label: str
    metadata: dict[str, Any] = field(default_factory=dict)


class JudgeSessionManager:
    def __init__(self) -> None:
        self._sessions: dict[str, JudgeSession] = {}

    def open_session(self, game_slug: str, table_label: str) -> JudgeSession:
        sid = str(uuid.uuid4())
        sess = JudgeSession(session_id=sid, game_slug=game_slug, table_label=table_label)
        self._sessions[sid] = sess
        return sess

    def get(self, session_id: str) -> JudgeSession | None:
        return self._sessions.get(session_id)

    def ensure_deterministic_session(
        self, session_id: str, game_slug: str, table_label: str
    ) -> JudgeSession:
        existing = self._sessions.get(session_id)
        if existing is not None:
            return existing
        sess = JudgeSession(session_id=session_id, game_slug=game_slug, table_label=table_label)
        self._sessions[session_id] = sess
        return sess
