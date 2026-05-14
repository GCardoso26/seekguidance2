"""DLQ persistente (Redis quando disponível; fallback in-memory para testes)."""

from __future__ import annotations

import json
import time
from typing import Any, Protocol


class _RedisLike(Protocol):
    def rpush(self, key: str, value: str) -> Any: ...
    def lrange(self, key: str, start: int, stop: int) -> list[Any]: ...


class DlqStore:
    def __init__(self, *, redis: _RedisLike | None, key_prefix: str) -> None:
        self._redis = redis
        self._prefix = key_prefix
        self._mem: dict[str, list[str]] = {}

    def _key(self, queue: str) -> str:
        return f"{self._prefix}:{queue}"

    def push(self, queue: str, payload: dict[str, Any]) -> None:
        body = json.dumps({"ts": time.time(), "payload": payload}, sort_keys=True, default=str)
        key = self._key(queue)
        if self._redis is not None:
            self._redis.rpush(key, body)
        else:
            self._mem.setdefault(key, []).append(body)

    def peek(self, queue: str, limit: int = 20) -> list[dict[str, Any]]:
        key = self._key(queue)
        if self._redis is not None:
            raw = self._redis.lrange(key, -limit, -1)
        else:
            raw = self._mem.get(key, [])[-limit:]
        out: list[dict[str, Any]] = []
        for r in raw:
            try:
                out.append(json.loads(r if isinstance(r, str) else r.decode()))
            except Exception:
                continue
        return out


def poison_message_heuristic(payload: dict[str, Any]) -> bool:
    """Heurística simples: payloads vazios ou sem identificador."""
    if not payload:
        return True
    return payload.get("job_id") is None and payload.get("url") is None
