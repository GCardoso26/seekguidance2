"""Engine de warmup no startup — reduz cold start percebido."""

from __future__ import annotations

import asyncio
import time
from typing import Any

import structlog

from app.core.config import Settings, get_settings
from app.runtime.runtime_real_metrics.collector import record
from app.runtime.runtime_warmup.runtime_hot_cache_manager_v1 import cache_status, warm_semantic_cache
from app.runtime.runtime_warmup.runtime_preload_manager_v1 import preload_registry_and_profiles, preload_status

logger = structlog.get_logger(__name__)

_warmup_state: dict[str, Any] = {
    "embedding_ready": False,
    "reranker_ready": False,
    "cache_ready": False,
    "judge_ready": False,
    "startup_duration_ms": 0.0,
    "warmup_duration_ms": 0.0,
    "preload_duration_ms": 0.0,
    "completed": False,
}
_startup_t0 = time.perf_counter()


async def _warm_embeddings(settings: Settings) -> bool:
    if not settings.openai_api_key:
        return False
    try:
        from app.runtime_judge_semantic_cache.cache import embed_question

        await embed_question(settings, "warmup probe")
        return True
    except Exception as exc:
        logger.warning("warmup_embedding_failed", error=str(exc))
        return False


async def _warm_reranker(settings: Settings) -> bool:
    if not settings.reranker_enabled:
        return True
    try:
        from app.retrieval.rerank import get_reranker

        reranker = get_reranker(settings)
        return await reranker.health_check()
    except Exception as exc:
        logger.warning("warmup_reranker_failed", error=str(exc))
        return False


async def _noop_false() -> bool:
    return False


async def _run_warmup_body(cfg: Settings, t0: float) -> None:
    """Corpo do warmup respeitando flags por componente."""
    preload = preload_registry_and_profiles()
    _warmup_state["preload_duration_ms"] = preload.get("duration_ms", 0.0)
    _warmup_state["judge_ready"] = preload.get("registry_ready", False)

    tasks: list[Any] = []
    if cfg.warmup_embedding:
        tasks.append(_warm_embeddings(cfg))
    else:
        tasks.append(_noop_false())
    tasks.append(warm_semantic_cache(cfg))

    results = await asyncio.gather(*tasks)
    embedding_ok = bool(results[0]) if cfg.warmup_embedding else True
    cache_ok = bool(results[1])

    reranker_ok = await _warm_reranker(cfg) if cfg.warmup_reranker else True

    try:
        from app.observability.tracing_runtime import configure_otel_runtime

        configure_otel_runtime(cfg)
    except Exception:
        pass

    _warmup_state.update(
        {
            "embedding_ready": embedding_ok or not cfg.openai_api_key,
            "reranker_ready": reranker_ok,
            "cache_ready": cache_ok or not cfg.judge_semantic_cache_enabled,
            "warmup_duration_ms": round((time.perf_counter() - t0) * 1000, 2),
            "startup_duration_ms": round((time.perf_counter() - _startup_t0) * 1000, 2),
            "completed": True,
            "skipped": False,
        }
    )

    record("startup.warmup_duration_ms", _warmup_state["warmup_duration_ms"])
    record("startup.duration_ms", _warmup_state["startup_duration_ms"])
    record("startup.preload_duration_ms", _warmup_state["preload_duration_ms"])
    logger.info("runtime_warmup_complete", **_warmup_state)


async def run_startup_warmup(settings: Settings | None = None) -> dict[str, Any]:
    """Executado no lifespan startup."""
    cfg = settings or get_settings()
    if not cfg.warmup_enabled:
        _warmup_state.update(
            {
                "completed": True,
                "skipped": True,
                "warmup_duration_ms": 0.0,
                "startup_duration_ms": round((time.perf_counter() - _startup_t0) * 1000, 2),
            }
        )
        logger.info("runtime_warmup_skipped", reason="warmup_enabled=false")
        return get_warmup_status()

    t0 = time.perf_counter()
    try:
        await asyncio.wait_for(_run_warmup_body(cfg, t0), timeout=float(cfg.warmup_timeout_seconds))
    except TimeoutError:
        logger.warning(
            "runtime_warmup_timeout",
            timeout_seconds=cfg.warmup_timeout_seconds,
        )
        _warmup_state["completed"] = True
        _warmup_state["warmup_duration_ms"] = round((time.perf_counter() - t0) * 1000, 2)
        _warmup_state["startup_duration_ms"] = round((time.perf_counter() - _startup_t0) * 1000, 2)
    return get_warmup_status()


def get_warmup_status() -> dict[str, Any]:
    return {
        "embedding_ready": _warmup_state["embedding_ready"],
        "reranker_ready": _warmup_state["reranker_ready"],
        "cache_ready": _warmup_state["cache_ready"],
        "judge_ready": _warmup_state["judge_ready"],
        "startup_duration_ms": _warmup_state["startup_duration_ms"],
        "warmup_duration_ms": _warmup_state["warmup_duration_ms"],
        "preload_duration_ms": _warmup_state["preload_duration_ms"],
        "completed": _warmup_state["completed"],
        "preload": preload_status(),
        "cache": cache_status(),
    }


def warmup_payload() -> dict[str, Any]:
    """Payload mínimo para GET /runtime/warmup."""
    s = get_warmup_status()
    return {
        "embedding_ready": s["embedding_ready"],
        "reranker_ready": s["reranker_ready"],
        "cache_ready": s["cache_ready"],
        "judge_ready": s["judge_ready"],
    }
