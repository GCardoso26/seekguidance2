"""POST /runtime/judge/query — consulta de regras TCG para UI do usuário final."""

from __future__ import annotations

import asyncio
import json
import re
from collections.abc import AsyncIterator
from typing import Any

import structlog
from app.api.deps import DbSession, get_rag_orchestrator
from app.application.rag_orchestrator import RagOrchestrator
from app.schemas.chat import ChatRequest
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["runtime-judge"])

# Slug da API RAG (games.slug)
TCG_GAME_SLUG: dict[str, str] = {
    "magic": "mtg",
    "mtg": "mtg",
    "pokemon": "pokemon",
    "lorcana": "lorcana",
    "yugioh": "yugioh",
    "onepiece": "onepiece",
    "one_piece": "onepiece",
    "flesh_and_blood": "fab",
    "fab": "fab",
    "gundam": "gundam",
    "digimon": "digimon",
    "dragon_ball": "dbfw",
    "dragon_ball_super_fusion_world": "dbfw",
    "dbfw": "dbfw",
    "sorcery": "sorcery",
    "sorcery_contested_realm": "sorcery",
    "vanguard": "vanguard",
    "cardfight_vanguard": "vanguard",
    "riftbound": "riftbound",
    "union_arena": "union_arena",
}

# Jogos sem corpus / fora do escopo do judge público
TCG_COMING_SOON: frozenset[str] = frozenset(
    {
        "swu",
        "star_wars_unlimited",
    }
)


class JudgeQueryBody(BaseModel):
    tcg: str = Field(..., examples=["magic"])
    question: str = Field(..., min_length=1, max_length=4000)
    context: str | None = Field(default=None, max_length=8000)


class JudgeSource(BaseModel):
    title: str
    url: str
    section: str | None = None
    excerpt: str | None = None


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


_TITLE_PT: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"comprehensive rules", re.I), "Regras Abrangentes (Comprehensive Rules)"),
    (re.compile(r"tournament rules", re.I), "Regras de Torneio"),
    (re.compile(r"infraction procedure", re.I), "Procedimentos de Infração (IPG)"),
]


def _title_for_display(raw: str) -> str:
    title = (raw or "").strip() or "Fonte oficial"
    if title.lower() in ("source", "document"):
        return "Fonte oficial"
    for pattern, label in _TITLE_PT:
        if pattern.search(title):
            return pattern.sub(label, title, count=1)
    return title


def _section_for_display(section: str | None) -> str | None:
    if not section or not str(section).strip():
        return None
    s = str(section).strip()
    if re.match(r"^\d", s):
        return f"Secção {s}"
    return s


def _sources_from_citations(citations: list[Any]) -> list[JudgeSource]:
    out: list[JudgeSource] = []
    for c in citations[:8]:
        raw_title = getattr(c, "document_title", "") or ""
        section = getattr(c, "section_path", None) or getattr(c, "rule_path", None)
        out.append(
            JudgeSource(
                title=_title_for_display(raw_title),
                url=getattr(c, "source_url", "") or "",
                section=_section_for_display(section),
                excerpt=(getattr(c, "excerpt", None) or "")[:280] or None,
            )
        )
    return out


def _normalize_tcg(raw: str) -> str:
    return re.sub(r"[^a-z0-9_]", "", raw.lower().strip().replace("-", "_"))


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
    tcg = _normalize_tcg(body.tcg)
    question = _compose_question(body)

    if tcg in TCG_COMING_SOON:
        label = tcg.replace("_", " ").title()
        return JudgeQueryResponse(
            success=False,
            answer=f"{label} estará disponível em breve. Por agora, use Magic: The Gathering.",
            confidence=0.0,
            sources=[],
        )

    game_slug = TCG_GAME_SLUG.get(tcg)
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
            sources=_sources_from_citations(chat.citations),
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
