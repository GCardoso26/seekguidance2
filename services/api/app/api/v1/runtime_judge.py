"""POST /runtime/judge/query — consulta de regras TCG para UI do usuário final."""

from __future__ import annotations

import re
from typing import Any

import structlog
from app.api.deps import DbSession, get_rag_orchestrator
from app.application.rag_orchestrator import RagOrchestrator
from app.schemas.chat import ChatRequest
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["runtime-judge"])

# Slug da API RAG (games.slug)
TCG_GAME_SLUG: dict[str, str] = {
    "magic": "mtg",
    "mtg": "mtg",
}

# UI futura — ainda sem corpus
TCG_COMING_SOON: frozenset[str] = frozenset(
    {
        "pokemon",
        "yugioh",
        "lorcana",
        "one_piece",
        "flesh_and_blood",
        "gundam",
        "digimon",
        "dragon_ball",
        "sorcery",
        "vanguard",
        "riftbound",
        "union_arena",
    }
)


class JudgeQueryBody(BaseModel):
    tcg: str = Field(..., examples=["magic"])
    question: str = Field(..., min_length=1, max_length=4000)


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


def _mock_answer(question: str, tcg: str) -> str | None:
    q = question.lower()
    if tcg in ("magic", "mtg") and "trample" in q:
        return (
            "Trample é uma habilidade estática que altera como o dano de combate é atribuído. "
            "O controlador do atacante com trample atribui primeiro dano letal aos bloqueadores; "
            "o excesso pode ir para o jogador/planeswalker atacado (regras 702.19a–702.19d)."
        )
    return None


def _sources_from_citations(citations: list[Any]) -> list[JudgeSource]:
    out: list[JudgeSource] = []
    for c in citations[:8]:
        out.append(
            JudgeSource(
                title=getattr(c, "document_title", "") or "Source",
                url=getattr(c, "source_url", "") or "",
                section=getattr(c, "section_path", None) or getattr(c, "rule_path", None),
                excerpt=(getattr(c, "excerpt", None) or "")[:280] or None,
            )
        )
    return out


@router.post("/runtime/judge/query", response_model=JudgeQueryResponse)
async def runtime_judge_query(
    body: JudgeQueryBody,
    session: DbSession,
    orchestrator: RagOrchestrator = Depends(get_rag_orchestrator),
) -> JudgeQueryResponse:
    tcg = re.sub(r"[^a-z0-9_]", "", body.tcg.lower().strip().replace("-", "_"))
    question = body.question.strip()

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
            ChatRequest(game_slug=game_slug, question=question, mode="player"),
        )
        return JudgeQueryResponse(
            success=True,
            answer=chat.answer,
            confidence=float(chat.confidence),
            sources=_sources_from_citations(chat.citations),
            runtime_confidence=0.94,
        )
    except Exception:
        logger.exception("runtime_judge_query_failed", tcg=tcg)
        fallback = _mock_answer(question, tcg)
        if fallback:
            return JudgeQueryResponse(
                success=True,
                answer=fallback,
                confidence=0.55,
                sources=[],
                runtime_confidence=0.94,
            )
        return JudgeQueryResponse(
            success=False,
            answer="Não foi possível processar a consulta agora. Tente novamente em instantes.",
            confidence=0.0,
            sources=[],
        )
