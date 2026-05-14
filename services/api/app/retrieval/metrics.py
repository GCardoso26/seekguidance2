"""Métricas leves (latências e contagens) — structlog + readiness OTel."""

from __future__ import annotations

import time
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


@contextmanager
def retrieval_timer(name: str) -> Generator[dict[str, Any], None, None]:
    t0 = time.perf_counter()
    payload: dict[str, Any] = {"phase": name}
    try:
        yield payload
    finally:
        payload["latency_ms"] = round((time.perf_counter() - t0) * 1000.0, 3)
        logger.info("retrieval.metrics", **payload)
