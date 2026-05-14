"""Backoff exponencial (async-friendly)."""

from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass


@dataclass
class BackoffConfig:
    base_seconds: float = 0.5
    max_seconds: float = 60.0
    factor: float = 2.0
    jitter_ratio: float = 0.1


async def sleep_backoff(attempt: int, cfg: BackoffConfig | None = None) -> None:
    c = cfg or BackoffConfig()
    delay = min(c.max_seconds, c.base_seconds * (c.factor ** max(0, attempt - 1)))
    jitter = delay * c.jitter_ratio * random.random()
    await asyncio.sleep(delay + jitter)
