from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx
import structlog

logger = structlog.get_logger(__name__)


class CircuitOpenError(RuntimeError):
    pass


class ResilientHttpClient:
    """HTTP client com retry, backoff exponencial, timeout e circuit breaker leve."""

    def __init__(
        self,
        *,
        timeout: float = 12.0,
        max_retries: int = 3,
        base_backoff: float = 0.5,
        failure_threshold: int = 5,
        recovery_seconds: float = 30.0,
        user_agent: str = "JudgeTCG/1.0",
    ) -> None:
        self._timeout = timeout
        self._max_retries = max_retries
        self._base_backoff = base_backoff
        self._failure_threshold = failure_threshold
        self._recovery_seconds = recovery_seconds
        self._user_agent = user_agent
        self._failures = 0
        self._opened_at: float | None = None

    def _circuit_open(self) -> bool:
        if self._opened_at is None:
            return False
        if time.monotonic() - self._opened_at >= self._recovery_seconds:
            self._opened_at = None
            self._failures = 0
            return False
        return True

    def _record_success(self) -> None:
        self._failures = 0
        self._opened_at = None

    def _record_failure(self) -> None:
        self._failures += 1
        if self._failures >= self._failure_threshold:
            self._opened_at = time.monotonic()
            logger.warning("external_http_circuit_open", failures=self._failures)

    async def request(
        self,
        method: str,
        url: str,
        *,
        headers: dict[str, str] | None = None,
        params: dict[str, Any] | None = None,
        json: Any = None,
    ) -> httpx.Response | None:
        if self._circuit_open():
            logger.warning("external_http_circuit_skip", url=url)
            raise CircuitOpenError("circuit open")

        merged_headers = {"User-Agent": self._user_agent, **(headers or {})}
        last_exc: Exception | None = None

        for attempt in range(self._max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    res = await client.request(
                        method,
                        url,
                        headers=merged_headers,
                        params=params,
                        json=json,
                    )
                if res.status_code == 429:
                    retry_after = float(res.headers.get("Retry-After", self._base_backoff * (2**attempt)))
                    logger.warning("external_http_429", url=url, retry_after=retry_after)
                    await asyncio.sleep(min(retry_after, 8.0))
                    continue
                if res.status_code >= 500:
                    self._record_failure()
                    await asyncio.sleep(self._base_backoff * (2**attempt))
                    continue
                self._record_success()
                return res
            except httpx.HTTPError as exc:
                last_exc = exc
                self._record_failure()
                await asyncio.sleep(self._base_backoff * (2**attempt))

        logger.error("external_http_failed", url=url, error=str(last_exc))
        return None
