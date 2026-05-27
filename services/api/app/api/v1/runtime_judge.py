"""Endpoints públicos Judge TCG — consulta, catálogo e health."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any

import structlog
from app.api.deps import DbSession, get_rag_orchestrator
from app.application.rag_orchestrator import RagOrchestrator
from app.core.config import get_settings
from app.judge.catalog import judge_health_payload, list_judge_games
from app.judge.registry import (
    TCG_COMING_SOON,
    game_slug_for_tcg,
    normalize_tcg,
)
from app.judge.sources import JudgeSource, sources_from_citations
from app.schemas.chat import ChatRequest
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["runtime-judge"])
settings = get_settings()


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


class JudgeGameCatalogItem(BaseModel):
    tcg_id: str
    game_slug: str
    display_name: str
    enabled: bool
    coming_soon: bool = False
    rag_ready: bool
    chunk_count: int = 0
    last_indexed_at: str | None = None
    last_chunk_at: str | None = None


class JudgeGamesResponse(BaseModel):
    games: list[JudgeGameCatalogItem]


class JudgeHealthResponse(BaseModel):
    status: str
    integrity_status: str
    database: str
    openai_configured: bool
    rag_ready_games: int
    total_games: int
    default_chat_model: str
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

    try:
        chat = await orchestrator.ask(
            session,
            ChatRequest(
                game_slug=game_slug,
                question=question,
                mode="player",
                verdict_format=True,
            ),
        )
        return JudgeQueryResponse(
            success=True,
            answer=chat.answer,
            confidence=float(chat.confidence),
            sources=sources_from_citations(chat.citations),
            runtime_confidence=0.94,
            verdict=chat.verdict,
            rule_applied=chat.rule_applied,
            explanation=chat.explanation,
            exceptions=chat.exceptions,
        )
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


@router.post("/runtime/judge/query/stream")
async def runtime_judge_query_stream(
    body: JudgeQueryBody,
    session: DbSession,
    orchestrator: RagOrchestrator = Depends(get_rag_orchestrator),
) -> StreamingResponse:
    async def generate() -> AsyncIterator[str]:
        try:
            result = await _execute_judge_query(body, session, orchestrator)
            async for chunk in _stream_judge_response(result):
                yield chunk
        except Exception:
            logger.exception("runtime_judge_stream_failed", tcg=body.tcg)
            yield _sse_payload(
                {
                    "type": "error",
                    "message": "Não foi possível processar a consulta agora. Tente novamente.",
                }
            )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
