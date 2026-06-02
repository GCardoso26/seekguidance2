"""Spans e métricas do pipeline Judge (OTEL opcional)."""

from __future__ import annotations

import time
from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass, field
from typing import Any

import structlog

from app.core.config import get_settings
from app.observability.tracing_runtime import configure_otel_runtime, get_trace_id, new_trace_id
from app.runtime.runtime_real_metrics.collector import record

logger = structlog.get_logger(__name__)

_PHASES: dict[str, list[float]] = {
    "embedding": [],
    "hyde": [],
    "retrieval": [],
    "reranking": [],
    "generating": [],
}
_REQUESTS = 0
_CONFIDENCE_SUM = 0.0
_CONFIDENCE_COUNT = 0
_CACHE_HITS = 0
_CACHE_MISSES = 0


@dataclass
class JudgeTraceContext:
    trace_id: str
    game_slug: str
    query_length: int
    hyde_enabled: bool = False
    reranker_enabled: bool = False
    reranker_provider: str = "local"
    cache_hit: bool = False
    n_chunks: int = 0
    confidence_score: float = 0.0
    response_tokens: int = 0
    spans: list[dict[str, Any]] = field(default_factory=list)

    def to_attrs(self) -> dict[str, Any]:
        return {
            "game_slug": self.game_slug,
            "query_length": self.query_length,
            "hyde_enabled": self.hyde_enabled,
            "reranker_enabled": self.reranker_enabled,
            "reranker_provider": self.reranker_provider,
            "n_chunks": self.n_chunks,
            "confidence_score": self.confidence_score,
            "cache_hit": self.cache_hit,
            "response_tokens": self.response_tokens,
            "trace_id": self.trace_id,
        }


def _otel_span(name: str, attrs: dict[str, Any]):
    settings = get_settings()
    if not settings.observability_otel_enabled:
        return None
    try:
        from opentelemetry import trace as otel_trace

        tracer = otel_trace.get_tracer("judge.tcg")
        return tracer.start_as_current_span(name, attributes={k: str(v) for k, v in attrs.items()})
    except Exception:
        return None


@contextmanager
def judge_span(name: str, ctx: JudgeTraceContext | None = None, **attrs: Any) -> Iterator[None]:
    t0 = time.perf_counter()
    merged = {**(ctx.to_attrs() if ctx else {}), **attrs}
    otel_cm = _otel_span(name, merged)
    if otel_cm:
        with otel_cm:
            yield
    else:
        yield
    elapsed = (time.perf_counter() - t0) * 1000
    if ctx:
        ctx.spans.append({"name": name, "duration_ms": round(elapsed, 2), **merged})
    record(f"judge.span.{name.replace('.', '_')}_ms", elapsed)


@asynccontextmanager
async def judge_span_async(
    name: str, ctx: JudgeTraceContext | None = None, **attrs: Any
) -> AsyncIterator[None]:
    t0 = time.perf_counter()
    merged = {**(ctx.to_attrs() if ctx else {}), **attrs}
    otel_cm = _otel_span(name, merged)
    if otel_cm:
        with otel_cm:
            yield
    else:
        yield
    elapsed = (time.perf_counter() - t0) * 1000
    if ctx:
        ctx.spans.append({"name": name, "duration_ms": round(elapsed, 2), **merged})
    record(f"judge.span.{name.replace('.', '_')}_ms", elapsed)


def record_judge_phase(phase: str, duration_seconds: float) -> None:
    bucket = _PHASES.setdefault(phase, [])
    bucket.append(duration_seconds)
    if len(bucket) > 500:
        del bucket[: len(bucket) - 500]
    record(f"judge.phase.{phase}_duration_seconds", duration_seconds)


def record_judge_request(
    *,
    game_slug: str,
    confidence: float,
    cache_hit: bool,
    n_chunks: int = 0,
) -> None:
    global _REQUESTS, _CONFIDENCE_SUM, _CONFIDENCE_COUNT, _CACHE_HITS, _CACHE_MISSES
    _REQUESTS += 1
    _CONFIDENCE_SUM += confidence
    _CONFIDENCE_COUNT += 1
    if cache_hit:
        _CACHE_HITS += 1
    else:
        _CACHE_MISSES += 1
    record("judge.requests_total", 1.0)
    record("judge.confidence_score", confidence)
    record(f"judge.chunks.{game_slug}", float(n_chunks))
    configure_otel_runtime(get_settings())


def judge_metrics_snapshot() -> dict[str, Any]:
    def p95(values: list[float]) -> float:
        if not values:
            return 0.0
        s = sorted(values)
        idx = min(len(s) - 1, int(len(s) * 0.95))
        return round(s[idx], 4)

    total_cache = _CACHE_HITS + _CACHE_MISSES
    return {
        "judge_requests_total": _REQUESTS,
        "judge_confidence_avg": round(_CONFIDENCE_SUM / _CONFIDENCE_COUNT, 4) if _CONFIDENCE_COUNT else 0.0,
        "judge_cache_hit_rate": round(_CACHE_HITS / total_cache, 4) if total_cache else 0.0,
        "judge_phase_duration_seconds": {
            phase: {"p95": p95(vals), "count": len(vals)} for phase, vals in _PHASES.items()
        },
        "alerts": _judge_alerts(),
        "trace_id_sample": get_trace_id() or new_trace_id(),
        "otel_enabled": get_settings().observability_otel_enabled,
    }


def _judge_alerts() -> list[str]:
    alerts: list[str] = []
    snap = judge_metrics_snapshot_inner()
    if snap.get("p95_latency_s", 0) > 8.0:
        alerts.append("p95_latency > 8s")
    if snap.get("confidence_avg", 1.0) < 0.55 and _CONFIDENCE_COUNT >= 5:
        alerts.append("confidence_avg < 0.55")
    if snap.get("cache_hit_rate", 1.0) < 0.30 and (_CACHE_HITS + _CACHE_MISSES) >= 10:
        alerts.append("cache_hit_rate < 30%")
    return alerts


def judge_metrics_snapshot_inner() -> dict[str, Any]:
    latencies = _PHASES.get("generating", []) + _PHASES.get("retrieval", [])
    p95 = 0.0
    if latencies:
        s = sorted(latencies)
        p95 = s[min(len(s) - 1, int(len(s) * 0.95))]
    total = _CACHE_HITS + _CACHE_MISSES
    return {
        "p95_latency_s": p95,
        "confidence_avg": _CONFIDENCE_SUM / _CONFIDENCE_COUNT if _CONFIDENCE_COUNT else 0.0,
        "cache_hit_rate": _CACHE_HITS / total if total else 0.0,
    }
