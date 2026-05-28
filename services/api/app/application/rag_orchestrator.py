"""Orquestrador RAG — routing, retrieval, context assembly judge-grade + LLM."""

from __future__ import annotations

import structlog
from app.context.assembler import ContextAssemblyEngine
from app.context.temporal import TemporalHint
from app.core.config import Settings
from app.games.registry import normalize_game_slug
from app.graph.feedback.feedback_engine import build_signal_bundle, record_retrieval_feedback_loop
from app.infrastructure.db.models import Game
from app.query_understanding import route_query
from app.reasoning import run_reasoning_engine
from app.reasoning.formal_response_addon import augment_reasoning_v8_to_v11
from app.retrieval.citation_service import citations_from_hits
from app.retrieval.confidence import citation_consistency_bonus
from app.retrieval.confidence_profiles import get_confidence_profile
from app.retrieval.hybrid import HybridRetriever
from app.retrieval.llm_openai import LlmComposer
from app.schemas.chat import ChatRequest, ChatResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


class RagOrchestrator:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def resolve_game(self, session: AsyncSession, game_slug: str):
        stmt = select(Game).where(Game.slug == game_slug, Game.enabled.is_(True))
        row = (await session.execute(stmt)).scalar_one_or_none()
        if row is None:
            return None
        return row

    async def ask(self, session: AsyncSession, payload: ChatRequest) -> ChatResponse:
        game_slug = normalize_game_slug(payload.game_slug)
        game = await self.resolve_game(session, game_slug)

        if game is None:
            profile = get_confidence_profile(game_slug)
            return ChatResponse(
                answer="Jogo não encontrado ou desabilitado para este tenant.",
                disclaimer=self._settings.official_sources_disclaimer,
                citations=[],
                confidence=0.0,
                model=None,
                confidence_notice_threshold=profile.ui_notice_threshold,
            )

        profile = get_confidence_profile(game.slug)

        if not self._settings.is_rag_enabled_for_game(game.slug):
            return ChatResponse(
                answer=(
                    f"RAG para o jogo '{game.slug}' não está habilitado neste ambiente. "
                    f"Ajuste RAG_ALLOWED_GAME_SLUGS (atual: {self._settings.rag_allowed_game_slugs})."
                ),
                disclaimer=self._settings.official_sources_disclaimer,
                citations=[],
                confidence=0.1,
                model=None,
                confidence_notice_threshold=profile.ui_notice_threshold,
            )

        if not self._settings.openai_api_key:
            return ChatResponse(
                answer=(
                    "Configure OPENAI_API_KEY para embeddings e geração. "
                    "Depois rode a ingestão (`python scripts/ingest_mtg.py` ou workers arq)."
                ),
                disclaimer=self._settings.official_sources_disclaimer,
                citations=[],
                confidence=0.05,
                model=None,
                confidence_notice_threshold=profile.ui_notice_threshold,
            )

        hint = route_query(payload.question, prefer_historical=payload.prefer_historical)
        temporal = TemporalHint(prefer_historical=hint.prefer_historical, as_of=payload.as_of)

        retriever = HybridRetriever(session, game.id, self._settings)
        try:
            outcome = await retriever.search(
                payload.question,
                top_k=10,
                hint=hint,
                temporal=temporal,
                game_slug=game.slug,
            )
            hits = outcome.hits
            base_conf = outcome.confidence
        except Exception as exc:  # pragma: no cover - diagnóstico operacional
            logger.exception("retrieval.failed", error=str(exc))
            return ChatResponse(
                answer="Falha no retrieval. Verifique embeddings no Postgres e logs estruturados.",
                disclaimer=self._settings.official_sources_disclaimer,
                citations=[],
                confidence=0.05,
                model=None,
            )

        if not hits:
            return ChatResponse(
                answer=(
                    "Nenhum trecho indexado encontrado para esta pergunta. "
                    "Execute a ingestão MTG (PDFs oficiais) e aguarde os workers de embedding."
                ),
                disclaimer=self._settings.official_sources_disclaimer,
                citations=[],
                confidence=0.14,
                model=None,
            )

        assembly_engine = ContextAssemblyEngine(self._settings)
        assembled = assembly_engine.assemble(
            question=payload.question,
            mode=payload.mode,
            hits=hits,
            hint=hint,
            temporal=temporal,
        )
        logger.info(
            "context.assembly.orchestrator",
            **{k: v for k, v in assembled.metrics.items()},
        )

        cites = citations_from_hits(hits)
        composer = LlmComposer(self._settings)
        try:
            result = await composer.compose(
                question=payload.question,
                hits=hits,
                mode=payload.mode,
                assembled=assembled,
                verdict_format=payload.verdict_format,
            )
        except Exception as exc:  # pragma: no cover
            logger.exception("llm.failed", error=str(exc))
            return ChatResponse(
                answer="Erro ao chamar o modelo. Trechos recuperados estão nas citações.",
                disclaimer=self._settings.official_sources_disclaimer,
                citations=cites[:8],
                confidence=0.2,
                model=None,
            )

        n_docs = len({c.document_title for c in cites})
        conf = min(
            1.0,
            base_conf + citation_consistency_bonus(len(cites), n_docs),
        )
        thr = profile.ui_notice_threshold
        answer = result.answer
        if conf < thr:
            answer += (
                "\n\nEsta situação pode exigir interpretação de um juiz de torneio; "
                "a confiança da recuperação está abaixo do habitual."
            )

        explain_v2 = outcome.explainability if payload.explain_retrieval else None
        reasoning_v3 = None
        if payload.include_reasoning_engine:
            report = run_reasoning_engine(
                payload.question,
                hits,
                game.slug,
                self._settings,
            )
            reasoning_v3 = report.to_api_dict()
            reasoning_v4 = report.constraint_resolution.to_api_dict() if report.constraint_resolution else None
            reasoning_v5 = (
                report.symbolic_resolution_v5.to_api_dict() if report.symbolic_resolution_v5 else None
            )
            reasoning_v6 = (
                report.semantic_resolution_v6.to_api_dict() if report.semantic_resolution_v6 else None
            )
            reasoning_v7 = (
                report.formal_runtime_resolution_v7.to_api_dict()
                if report.formal_runtime_resolution_v7
                else None
            )
            reasoning_v8 = (
                report.formal_trustworthiness_v8.to_api_dict()
                if report.formal_trustworthiness_v8
                else None
            )
            reasoning_v9 = (
                report.semantic_rule_intelligence_v9.to_api_dict()
                if report.semantic_rule_intelligence_v9
                else None
            )
            reasoning_v10 = (
                report.temporal_semantic_intelligence_v10.to_api_dict()
                if report.temporal_semantic_intelligence_v10
                else None
            )
            reasoning_v11 = (
                report.distributed_judge_runtime_v11.to_api_dict()
                if report.distributed_judge_runtime_v11
                else None
            )
            reasoning_v8, reasoning_v9, reasoning_v10, reasoning_v11 = augment_reasoning_v8_to_v11(
                self._settings,
                game_slug=game.slug,
                reasoning_v8=reasoning_v8,
                reasoning_v9=reasoning_v9,
                reasoning_v10=reasoning_v10,
                reasoning_v11=reasoning_v11,
            )
        else:
            reasoning_v3 = None
            reasoning_v4 = None
            reasoning_v5 = None
            reasoning_v6 = None
            reasoning_v7 = None
            reasoning_v8 = None
            reasoning_v9 = None
            reasoning_v10 = None
            reasoning_v11 = None

        signals = build_signal_bundle(
            query_id=outcome.query_id,
            confidence=conf,
            n_citations=len(cites),
            graph_edges_used=outcome.graph_edges_used,
            reasoning_path=outcome.reasoning_path,
            graph_candidates=outcome.graph_expansion_candidates,
            graph_limit=max(1, outcome.graph_expansion_limit_used),
            top_k=len(hits),
            vec_lex_overlap=outcome.signals.vec_lex_overlap,
        )
        await record_retrieval_feedback_loop(
            session,
            game.id,
            self._settings,
            question=payload.question,
            intent=hint.analysis.primary.value,
            signals=signals,
            graph_candidates=outcome.graph_expansion_candidates,
            graph_limit=max(1, outcome.graph_expansion_limit_used),
            final_hits=len(hits),
            vec_lex_overlap=outcome.signals.vec_lex_overlap,
        )

        return ChatResponse(
            answer=answer,
            disclaimer=self._settings.official_sources_disclaimer,
            citations=cites,
            confidence=round(float(conf), 4),
            model=result.model,
            verdict=result.verdict,
            rule_applied=result.rule_applied,
            explanation=result.explanation,
            exceptions=result.exceptions,
            retrieval_reasons=outcome.retrieval_reasons if payload.explain_retrieval else None,
            explainability=explain_v2,
            reasoning_v3=reasoning_v3,
            reasoning_v4=reasoning_v4,
            reasoning_v5=reasoning_v5,
            reasoning_v6=reasoning_v6,
            reasoning_v7=reasoning_v7,
            reasoning_v8=reasoning_v8,
            reasoning_v9=reasoning_v9,
            reasoning_v10=reasoning_v10,
            reasoning_v11=reasoning_v11,
            confidence_notice_threshold=profile.ui_notice_threshold,
        )
