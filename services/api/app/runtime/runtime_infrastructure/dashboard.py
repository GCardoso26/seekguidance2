"""Infrastructure dashboard payload — health score, warmup, OTEL, deps."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.runtime.runtime_judge_tracing.tracer import judge_metrics_snapshot
from app.runtime.runtime_real_metrics.collector import snapshot as metrics_snapshot
from app.runtime.runtime_resilience.events import degraded_status
from app.runtime.runtime_warmup import get_warmup_status
from app.runtime_judge_semantic_cache.cache import cache_stats_snapshot


async def infrastructure_payload(session: AsyncSession, settings: Settings) -> dict[str, Any]:
    db_ok = True
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    redis_ok = True
    try:
        if settings.redis_url:
            from app.core.rate_limit import _get_redis

            r = _get_redis(settings.redis_url)
            if r:
                r.ping()
    except Exception:
        redis_ok = False

    warmup = get_warmup_status()
    judge_metrics = judge_metrics_snapshot()
    cache_stats = cache_stats_snapshot()
    degraded = degraded_status()

    score = _health_score(db_ok, redis_ok, warmup, judge_metrics, cache_stats)

    return {
        "operational_health_score": score,
        "warmup": warmup,
        "judge_metrics": judge_metrics,
        "cache_hit_rate": cache_stats.get("cache_hit_rate", 0.0),
        "degraded_mode": degraded,
        "dependencies": {
            "database": "ok" if db_ok else "offline",
            "redis": "ok" if redis_ok else "offline",
            "otel": "enabled" if settings.observability_otel_enabled else "disabled",
        },
        "runtime_metrics": metrics_snapshot(),
        "workers": {"web_concurrency": 1},
        "ingestion_queue_pending": await _pending_jobs(session),
    }


async def _pending_jobs(session: AsyncSession) -> int:
    try:
        row = (
            await session.execute(
                text(
                    "SELECT COUNT(*)::int AS c FROM tcg_judge.ingestion_jobs WHERE status IN ('pending','running')"
                )
            )
        ).mappings().first()
        return int(row["c"]) if row else 0
    except Exception:
        return 0


def _health_score(
    db_ok: bool,
    redis_ok: bool,
    warmup: dict[str, Any],
    judge_metrics: dict[str, Any],
    cache_stats: dict[str, Any],
) -> int:
    score = 100
    if not db_ok:
        score -= 35
    if not redis_ok:
        score -= 10
    if not warmup.get("judge_ready"):
        score -= 15
    if not warmup.get("embedding_ready"):
        score -= 10
    conf = judge_metrics.get("judge_confidence_avg", 0.0)
    if conf and conf < 0.55:
        score -= 10
    hit = cache_stats.get("cache_hit_rate", 0.0)
    if hit and hit < 0.3:
        score -= 5
    return max(0, min(100, score))
