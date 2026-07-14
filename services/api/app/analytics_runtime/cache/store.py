"""TTL cache for dashboard/metric reads (target hit >95%, p95 <300ms)."""

from __future__ import annotations

import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, TypeVar

T = TypeVar("T")


@dataclass
class CacheEntry:
    value: Any
    expires_at: float


class RuntimeCache:
    def __init__(self, default_ttl_seconds: float = 60.0) -> None:
        self._default_ttl = default_ttl_seconds
        self._store: dict[str, CacheEntry] = {}
        self._lock = threading.RLock()
        self.hits = 0
        self.misses = 0
        self.invalidations = 0

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self.misses += 1
                return None
            if entry.expires_at < time.monotonic():
                del self._store[key]
                self.misses += 1
                return None
            self.hits += 1
            return entry.value

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        with self._lock:
            self._store[key] = CacheEntry(
                value=value,
                expires_at=time.monotonic() + (ttl if ttl is not None else self._default_ttl),
            )

    def get_or_set(self, key: str, factory: Callable[[], T], ttl: float | None = None) -> T:
        cached = self.get(key)
        if cached is not None:
            return cached  # type: ignore[return-value]
        value = factory()
        self.set(key, value, ttl=ttl)
        return value

    def invalidate(self, prefix: str | None = None) -> int:
        with self._lock:
            if prefix is None:
                n = len(self._store)
                self._store.clear()
                self.invalidations += n
                return n
            keys = [k for k in self._store if k.startswith(prefix)]
            for k in keys:
                del self._store[k]
            self.invalidations += len(keys)
            return len(keys)

    def hit_ratio(self) -> float:
        total = self.hits + self.misses
        if total == 0:
            return 1.0
        return self.hits / total

    def stats(self) -> dict[str, Any]:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio": round(self.hit_ratio(), 4),
            "entries": len(self._store),
            "invalidations": self.invalidations,
            "default_ttl_seconds": self._default_ttl,
        }
