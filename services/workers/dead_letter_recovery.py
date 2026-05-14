"""Recuperação de mensagens DLQ (peek + filtro)."""

from __future__ import annotations

from typing import Any

from dlq_store import DlqStore


def recover_dlq_peek(store: DlqStore, queue: str, *, limit: int = 50) -> list[dict[str, Any]]:
    return store.peek(queue, limit=limit)
