"""Índice semântico de replay (stub de entradas indexáveis)."""

from __future__ import annotations

from typing import Any


def semantic_replay_index_stub(entries: list[dict[str, Any]]) -> dict[str, Any]:
    keys = sorted({str(e.get("replay_key", "")) for e in entries if e.get("replay_key")})
    return {"indexed": len(keys), "keys": keys}
