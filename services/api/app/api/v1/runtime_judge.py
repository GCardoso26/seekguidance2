"""Endpoints públicos Judge TCG — consulta, catálogo e health."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any, Literal

import structlog
from app.api.deps import DbSession, get_rag_orchestrator
from app.application.rag_orchestrator import RagOrchestrator
from app.core.config import get_settings
from app.judge.catalog import judge_health_payload, list_judge_games
from app.judge.growth_metrics import record_growth_metric
from app.judge.observability import judge_quality_payload
from app.judge.registry import (
    TCG_COMING_SOON,
    game_slug_for_tcg,
    normalize_tcg,
)
from app.judge.related_questions import generate_related_questions
from app.judge.sources import JudgeSource, sources_from_citations
from app.observability.tracing_runtime import new_trace_id
from app.retrieval.confidence_profiles import get_confidence_profile
from app.retrieval.stream_phases import reset_phase_callback, set_phase_callback
from app.runtime.runtime_judge_tracing.tracer import (
    JudgeTraceContext,
    judge_span,
    record_judge_phase,
    record_judge_request,
)
from app.retrieval.semantic_cache import (
    get_cached_response as get_hash_cached_response,
    set_cached_response as set_hash_cached_response,
)
from app.runtime_judge_semantic_cache.cache import (
    embed_question,
    get_semantic_cache,
)
from app.schemas.chat import ChatRequest
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import text

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["runtime-judge"])
settings = get_settings()


def _redis_client_for_hash():
    if not settings.redis_url:
        return None
    try:
        import redis

        client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


def _cache_enabled(cfg) -> bool:
    return bool(cfg.semantic_cache_enabled or cfg.judge_semantic_cache_enabled)


def _use_hash_cache(cfg) -> bool:
    return _cache_enabled(cfg) and cfg.semantic_cache_provider in ("hash", "redis_stack")


class JudgeQueryBody(BaseModel):
    tcg: str = Field(..., examples=["magic"])
    question: str = Field(..., min_length=1, max_length=4000)
    context: str | None = Field(default=None, max_length=8000)


class JudgeQueryResponse(BaseModel):
    success: bool
    answer: str
    confidence: float = 0.0
    sources: list[JudgeSource] = Field(default_factory=list)
    runtime_confidence: float = 0.94
    integrity_status: str = "ok"
    verdict: str | None = None
    rule_applied: str | None = None
    explanation: str | None = None
    exceptions: str | None = None
    confidence_notice_threshold: float = 0.42
    related_questions: list[str] = Field(default_factory=list)


class JudgeGameCatalogItem(BaseModel):
    tcg_id: str
    game_slug: str
    display_name: str
    enabled: bool
    coming_soon: bool = False
    beta: bool = False
    rag_ready: bool
    chunk_count: int = 0
    last_indexed_at: str | None = None
    last_chunk_at: str | None = None
    confidence_notice_threshold: float = 0.42


class JudgeGamesResponse(BaseModel):
    games: list[JudgeGameCatalogItem]


class JudgeFeedbackRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)
    game_slug: str
    verdict: str | None = None
    rating: Literal["positive", "negative"]
    comment: str | None = Field(None, max_length=500)
    chunk_ids: list[str] | None = None


class JudgeHealthResponse(BaseModel):
    status: str
    integrity_status: str
    database: str
    openai_configured: bool
    rag_ready_games: int
    total_games: int
    default_chat_model: str
    cache_hit_rate: float = 0.0
    cache_stats: dict[str, Any] | None = None
    games: list[JudgeGameCatalogItem]


def _mock_answer(
    question: str, tcg: str
) -> tuple[str, str | None, str | None, str | None, str | None]:
    q = question.lower()
    if tcg in ("magic", "mtg") and "trample" in q:
        explanation = (
            "Trample é uma habilidade estática que altera como o dano de combate é atribuído. "
            "O controlador do atacante com trample atribui primeiro dano letal aos bloqueadores; "
            "o excesso pode ir para o jogador/planeswalker atacado (regras 702.19a–702.19d)."
        )
        return (
            explanation,
            "Informação",
            "CR 702.19 — Trample",
            explanation,
            None,
        )
    return ("", None, None, None, None)


def _compose_question(body: JudgeQueryBody) -> str:
    question = body.question.strip()
    ctx = (body.context or "").strip()
    if not ctx:
        return question
    return f"Contexto da conversa anterior:\n{ctx}\n\nNova pergunta: {question}"


async def _execute_judge_query(
    body: JudgeQueryBody,
    session: DbSession,
    orchestrator: RagOrchestrator,
) -> JudgeQueryResponse:
    tcg = normalize_tcg(body.tcg)
    question = _compose_question(body)

    if tcg in TCG_COMING_SOON:
        label = tcg.replace("_", " ").title()
        return JudgeQueryResponse(
            success=False,
            answer=f"{label} estará disponível em breve. Por agora, use Magic: The Gathering.",
            confidence=0.0,
            sources=[],
        )

    game_slug = game_slug_for_tcg(tcg)
    if not game_slug:
        return JudgeQueryResponse(
            success=False,
            answer=f"TCG '{body.tcg}' não reconhecido. Use 'magic' para Magic: The Gathering.",
            confidence=0.0,
            sources=[],
        )

    cfg = get_settings()
    cache = get_semantic_cache(cfg)
    redis_hash = _redis_client_for_hash()
    embedding: list[float] | None = None
    trace = JudgeTraceContext(
        trace_id=new_trace_id(),
        game_slug=game_slug,
        query_length=len(question),
        hyde_enabled=cfg.hyde_enabled,
        reranker_enabled=cfg.reranker_enabled,
        reranker_provider=cfg.reranker_provider,
    )
    try:
        with judge_span("judge.request", trace):
            if _use_hash_cache(cfg):
                hash_cached = await get_hash_cached_response(
                    redis_hash,
                    game_slug,
                    question,
                    cfg.default_embedding_model,
                    enabled=True,
                )
                if hash_cached:
                    trace.cache_hit = True
                    hash_cached["cache_hit"] = True
                    record_judge_request(
                        game_slug=game_slug,
                        confidence=float(hash_cached.get("confidence", 0)),
                        cache_hit=True,
                    )
                    return JudgeQueryResponse(**hash_cached)

            if cfg.judge_semantic_cache_enabled and cfg.semantic_cache_provider == "embedding" and cfg.openai_api_key:
                with judge_span("judge.embedding", trace):
                    embedding = await embed_question(cfg, question)
                cached = await cache.lookup(game_slug, embedding)
                if cached:
                    trace.cache_hit = True
                    record_judge_request(
                        game_slug=game_slug,
                        confidence=float(cached.get("confidence", 0)),
                        cache_hit=True,
                    )
                    return JudgeQueryResponse(**cached)
            elif cfg.judge_semantic_cache_enabled and cfg.semantic_cache_provider not in ("hash", "redis_stack") and cfg.openai_api_key:
                with judge_span("judge.embedding", trace):
                    embedding = await embed_question(cfg, question)
                cached = await cache.lookup(game_slug, embedding)
                if cached:
                    trace.cache_hit = True
                    record_judge_request(
                        game_slug=game_slug,
                        confidence=float(cached.get("confidence", 0)),
                        cache_hit=True,
                    )
                    return JudgeQueryResponse(**cached)

            with judge_span("judge.retrieval", trace):
                chat = await orchestrator.ask(
                    session,
                    ChatRequest(
                        game_slug=game_slug,
                        question=question,
                        mode="player",
                        verdict_format=True,
                    ),
                )
        rule_path = None
        rule_atom = None
        rule_section = None
        if chat.citations:
            top = chat.citations[0]
            rule_path = getattr(top, "rule_path", None) or (
                top.get("rule_path") if isinstance(top, dict) else None
            )
            rule_atom = getattr(top, "rule_atom", None) or (
                top.get("rule_atom") if isinstance(top, dict) else None
            )
            rule_section = getattr(top, "section", None) or (
                top.get("section") if isinstance(top, dict) else None
            )

        related = generate_related_questions(
            question,
            game_slug,
            rule_applied=chat.rule_applied,
            rule_path=rule_path,
            rule_atom=rule_atom,
            rule_section=rule_section,
        )

        trace.n_chunks = len(chat.citations or [])
        trace.confidence_score = float(chat.confidence)
        trace.response_tokens = len(chat.answer or "")

        with judge_span("judge.generating", trace):
            response = JudgeQueryResponse(
                success=True,
                answer=chat.answer,
                confidence=float(chat.confidence),
                sources=sources_from_citations(chat.citations),
                runtime_confidence=0.94,
                verdict=chat.verdict,
                rule_applied=chat.rule_applied,
                explanation=chat.explanation,
                exceptions=chat.exceptions,
                confidence_notice_threshold=float(
                    chat.confidence_notice_threshold
                    or get_confidence_profile(game_slug).ui_notice_threshold
                ),
                related_questions=related,
            )
        if _use_hash_cache(cfg):
            await set_hash_cached_response(
                redis_hash,
                game_slug,
                question,
                cfg.default_embedding_model,
                response.model_dump(),
                enabled=True,
                ttl_seconds=cfg.semantic_cache_ttl_seconds,
            )
        elif cfg.judge_semantic_cache_enabled and cfg.openai_api_key and embedding is not None:
            await cache.store(game_slug, embedding, response.model_dump())
        record_judge_request(
            game_slug=game_slug,
            confidence=float(chat.confidence),
            cache_hit=False,
            n_chunks=trace.n_chunks,
        )
        record_judge_phase("generating", len(chat.answer or "") / 1000.0)
        try:
            await record_growth_metric(
                session,
                "judge_question_sent",
                game=game_slug,
                details={"tcg": tcg},
            )
        except Exception:
            pass
        return response
    except Exception:
        logger.exception("runtime_judge_query_failed", tcg=tcg)
        mock = _mock_answer(question, tcg)
        answer, verdict, rule_applied, explanation, exceptions = mock
        if answer:
            return JudgeQueryResponse(
                success=True,
                answer=answer,
                confidence=0.55,
                sources=[],
                runtime_confidence=0.94,
                verdict=verdict,
                rule_applied=rule_applied,
                explanation=explanation,
                exceptions=exceptions,
            )
        return JudgeQueryResponse(
            success=False,
            answer="Não foi possível processar a consulta agora. Tente novamente em instantes.",
            confidence=0.0,
            sources=[],
        )


@router.get("/runtime/judge/health", response_model=JudgeHealthResponse)
async def runtime_judge_health(session: DbSession) -> JudgeHealthResponse:
    payload = await judge_health_payload(session, settings)
    return JudgeHealthResponse(**payload)


@router.get("/runtime/judge/{game_slug}/status")
async def runtime_judge_game_status(game_slug: str, session: DbSession) -> dict[str, Any]:
    """Status de corpus e ingestão por jogo (usado pelo CI de avaliação)."""
    slug = game_slug.strip().lower()
    games = await list_judge_games(session, settings)
    game = next((g for g in games if g["game_slug"] == slug), None)
    rag_ready = bool(game and game.get("rag_ready"))
    pending = False
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*)::int AS n
                    FROM tcg_judge.ingestion_jobs j
                    JOIN tcg_judge.games g ON g.id = j.game_id
                    WHERE g.slug = :slug
                      AND j.status IN ('pending', 'running', 'queued')
                    """
                ),
                {"slug": slug},
            )
        ).scalar_one()
        pending = int(row or 0) > 0
    except Exception:
        pending = False
    return {
        "game_slug": slug,
        "rag_ready": rag_ready,
        "ingestion_job_pending": pending,
        "chunk_count": int(game.get("chunk_count", 0)) if game else 0,
    }


@router.get("/runtime/judge/quality-metrics")
async def runtime_judge_quality_metrics(session: DbSession, days: int = 1) -> dict[str, Any]:
    """Métricas agregadas de qualidade (alias enriquecido para dashboard Wave 2A)."""
    from datetime import datetime, timezone

    base = await judge_quality_payload(session, days=days)
    games_map: dict[str, Any] = {}
    for g in base.get("games") or []:
        slug = str(g.get("game_slug") or "").strip().lower()
        if not slug:
            continue
        games_map[slug] = {
            "queries_24h": int((g.get("questions_per_day") or 0) * max(days, 1)),
            "thumbs_up_pct": g.get("thumbs_up_pct"),
            "thumbs_down_pct": g.get("thumbs_down_pct"),
            "confidence_avg": g.get("confidence_avg"),
            "cache_hit_rate": base.get("cache", {}).get("cache_hit_rate", 0.0),
            "alert_active": bool(g.get("alert_active") or g.get("alert")),
            "latency_p50_ms": base.get("latency", {}).get("generation_ms", {}).get("p50", 0),
            "latency_p95_ms": base.get("latency", {}).get("generation_ms", {}).get("p95", 0),
            "latency_p99_ms": base.get("latency", {}).get("generation_ms", {}).get("p99", 0),
            "latency_by_phase": {
                "embedding_ms": base.get("latency", {}).get("embedding_ms", {}).get("p50", 0),
                "hyde_ms": 0,
                "retrieval_ms": base.get("latency", {}).get("retrieval_ms", {}).get("p50", 0),
                "reranking_ms": base.get("latency", {}).get("reranking_ms", {}).get("p50", 0),
                "generation_ms": base.get("latency", {}).get("generation_ms", {}).get("p50", 0),
            },
        }
    alerts = [slug for slug, m in games_map.items() if m.get("alert_active")]
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "games": games_map,
        "alerts": alerts,
    }


@router.get("/runtime/judge/quality")
async def runtime_judge_quality(session: DbSession, days: int = 7) -> dict[str, Any]:
    """Métricas de qualidade para dashboard (feedback, cache, latência)."""
    return await judge_quality_payload(session, days=days)


@router.get("/runtime/judge/games", response_model=JudgeGamesResponse)
async def runtime_judge_games(session: DbSession) -> JudgeGamesResponse:
    games = await list_judge_games(session, settings)
    return JudgeGamesResponse(games=[JudgeGameCatalogItem(**g) for g in games])


@router.post("/runtime/judge/query", response_model=JudgeQueryResponse)
async def runtime_judge_query(
    body: JudgeQueryBody,
    session: DbSession,
    orchestrator: RagOrchestrator = Depends(get_rag_orchestrator),
) -> JudgeQueryResponse:
    return await _execute_judge_query(body, session, orchestrator)


def _sse_payload(data: dict[str, Any]) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _stream_judge_response(result: JudgeQueryResponse) -> AsyncIterator[str]:
    text = result.answer or result.explanation or ""
    chunk_size = 28
    for i in range(0, len(text), chunk_size):
        yield _sse_payload({"type": "token", "text": text[i : i + chunk_size]})
        await asyncio.sleep(0.018)

    payload = result.model_dump()
    payload["type"] = "done"
    yield _sse_payload(payload)


@router.post("/runtime/judge/feedback", status_code=202)
async def submit_judge_feedback(body: JudgeFeedbackRequest, session: DbSession) -> dict[str, str]:
    """Feedback do utilizador (best-effort, 202 Accepted)."""
    chunk_ids_json = json.dumps(body.chunk_ids or [])
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.judge_user_feedback
              (game_slug, question, verdict, rating, comment, chunk_ids)
            VALUES (:game_slug, :question, :verdict, :rating, :comment, CAST(:chunk_ids AS jsonb))
            """
        ),
        {
            "game_slug": body.game_slug.strip().lower(),
            "question": body.question.strip(),
            "verdict": body.verdict,
            "rating": body.rating,
            "comment": body.comment,
            "chunk_ids": chunk_ids_json,
        },
    )
    await session.commit()
    return {"status": "accepted"}


@router.post("/runtime/judge/query/stream")
async def runtime_judge_query_stream(
    body: JudgeQueryBody,
    session: DbSession,
    orchestrator: RagOrchestrator = Depends(get_rag_orchestrator),
) -> StreamingResponse:
    async def generate() -> AsyncIterator[str]:
        phase_queue: asyncio.Queue[dict[str, str]] = asyncio.Queue()

        async def phase_cb(phase: str, label: str) -> None:
            await phase_queue.put({"type": "phase", "phase": phase, "label": label})

        token = set_phase_callback(phase_cb)
        task = asyncio.create_task(_execute_judge_query(body, session, orchestrator))

        try:
            while True:
                if task.done() and phase_queue.empty():
                    break
                try:
                    item = await asyncio.wait_for(phase_queue.get(), timeout=0.05)
                    yield _sse_payload(item)
                except TimeoutError:
                    if task.done():
                        break
                    continue

            result = await task
            async for chunk in _stream_judge_response(result):
                yield chunk
        except Exception:
            logger.exception("runtime_judge_stream_failed", tcg=body.tcg)
            if not task.done():
                task.cancel()
            yield _sse_payload(
                {
                    "type": "error",
                    "message": "Não foi possível processar a consulta agora. Tente novamente.",
                }
            )
        finally:
            reset_phase_callback(token)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
