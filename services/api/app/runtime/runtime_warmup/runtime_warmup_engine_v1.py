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


def _warm_reranker(settings: Settings) -> bool:
    if not settings.reranker_enabled:
        return True
    try:
        from app.retrieval.rerank import get_reranker

        reranker = get_reranker(settings)
        return reranker is not None
    except Exception as exc:
        logger.warning("warmup_reranker_failed", error=str(exc))
        return False


async def run_startup_warmup(settings: Settings | None = None) -> dict[str, Any]:
    """Executado no lifespan startup."""
    cfg = settings or get_settings()
    t0 = time.perf_counter()

    preload = preload_registry_and_profiles()
    _warmup_state["preload_duration_ms"] = preload.get("duration_ms", 0.0)

    embedding_ok, cache_ok = await asyncio.gather(
        _warm_embeddings(cfg),
        warm_semantic_cache(cfg),
    )
    reranker_ok = _warm_reranker(cfg)

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
            "judge_ready": preload.get("registry_ready", False),
            "warmup_duration_ms": round((time.perf_counter() - t0) * 1000, 2),
            "startup_duration_ms": round((time.perf_counter() - _startup_t0) * 1000, 2),
            "completed": True,
        }
    )

    record("startup.warmup_duration_ms", _warmup_state["warmup_duration_ms"])
    record("startup.duration_ms", _warmup_state["startup_duration_ms"])
    record("startup.preload_duration_ms", _warmup_state["preload_duration_ms"])
    logger.info("runtime_warmup_complete", **_warmup_state)
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
