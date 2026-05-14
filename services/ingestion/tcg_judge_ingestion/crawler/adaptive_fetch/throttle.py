"""Throttle adaptativo por host (token bucket simples)."""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field


@dataclass
class HostThrottle:
    rps: float
    _tokens: float = field(init=False)
    _last: float = field(init=False)

    def __post_init__(self) -> None:
        self._tokens = self.rps
        self._last = time.monotonic()

    async def acquire(self) -> None:
        while True:
            now = time.monotonic()
            elapsed = now - self._last
            self._last = now
            self._tokens = min(self.rps, self._tokens + elapsed * self.rps)
            if self._tokens >= 1.0:
                self._tokens -= 1.0
                return
            await asyncio.sleep(0.05)
