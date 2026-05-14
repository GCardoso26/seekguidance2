"""Fetch resiliente com retry + circuit breaker + métricas."""

from __future__ import annotations

import time
from urllib.parse import urlparse

import httpx

from tcg_judge_ingestion.monitoring.ingestion_metrics import inc as metric_inc
from tcg_judge_ingestion.monitoring.ingestion_metrics import observe as metric_observe
from tcg_judge_ingestion.retry.backoff import sleep_backoff
from tcg_judge_ingestion.retry.circuit_breaker import CircuitBreakerRegistry
from tcg_judge_ingestion.retry.policies import RetryPolicy


async def resilient_get_bytes(
    url: str,
    *,
    user_agent: str,
    policy: RetryPolicy | None = None,
    breakers: CircuitBreakerRegistry | None = None,
    host_key: str | None = None,
) -> tuple[bytes, str, dict[str, str]]:
    """Devolve (bytes, mime, headers_dict)."""
    p = policy or RetryPolicy()
    br = breakers or CircuitBreakerRegistry()
    key = host_key or urlparse(url).netloc or "default"
    breaker = br.get(key)
    last_exc: Exception | None = None
    t0 = 0.0
    for attempt in range(1, p.max_attempts + 1):
        if not breaker.allow():
            metric_inc("circuit_open_wait")
            await sleep_backoff(attempt)
            continue
        try:
            t0 = time.perf_counter()
            headers = {"User-Agent": user_agent}
            async with httpx.AsyncClient(
                follow_redirects=True,
                headers=headers,
                timeout=p.request_timeout_s,
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.content
                mime = resp.headers.get("content-type", "application/octet-stream").split(";")[0].strip()
                hdrs = {k.lower(): v for k, v in resp.headers.items()}
            breaker.record_success()
            metric_inc("crawl_success_total")
            metric_observe("pipeline_latency_ms", (time.perf_counter() - t0) * 1000.0)
            return data, mime, hdrs
        except Exception as exc:  # pragma: no cover - rede variável
            last_exc = exc
            breaker.record_failure()
            metric_inc("retry_frequency")
            if attempt >= p.max_attempts:
                break
            await sleep_backoff(attempt)
    metric_inc("crawl_fail_total")
    if last_exc is None:
        raise RuntimeError(f"resilient_get failed after {p.max_attempts}")
    raise RuntimeError(f"resilient_get failed after {p.max_attempts}: {last_exc}") from last_exc
