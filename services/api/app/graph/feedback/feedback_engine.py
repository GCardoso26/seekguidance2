"""Orquestra sinais de retrieval → persistência + reforço de arestas."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.graph.feedback.drift_detection import drift_metrics_bundle
from app.graph.feedback.edge_reinforcement import reinforce_edges
from app.graph.feedback.graph_health import estimate_noise_ratio, estimate_traversal_efficiency, graph_health_summary
from app.graph.feedback.retrieval_outcome_tracking import insert_retrieval_feedback_row

logger = structlog.get_logger(__name__)


@dataclass
class RetrievalSignalBundle:
    query_id: UUID | None
    retrieval_success: bool
    confidence: float
    citation_density: float
    graph_edges_used: list[str]
    reasoning_path: list[str]
    token_efficiency: float
    hallucination_risk: float
    graph_quality_score: float
    retrieval_quality_score: float


def build_signal_bundle(
    *,
    query_id: UUID | None,
    confidence: float,
    n_citations: int,
    graph_edges_used: list[str],
    reasoning_path: list[str],
    graph_candidates: int,
    graph_limit: int,
    top_k: int,
    vec_lex_overlap: float | None,
) -> RetrievalSignalBundle:
    cit_density = min(1.0, n_citations / 8.0) * min(1.0, confidence + 0.15)
    tok_eff = min(1.0, top_k / max(1, graph_candidates + top_k) + 0.25)
    hall = max(0.0, min(1.0, 1.05 - confidence * 0.85 - cit_density * 0.35))
    gqs = min(1.0, confidence * 0.55 + cit_density * 0.35 + (1.0 - hall) * 0.15)
    noise = estimate_noise_ratio(confidence, graph_candidates, tok_eff)
    rqs = min(1.0, confidence * 0.5 + (1.0 - noise) * 0.35 + (vec_lex_overlap or 0.0) * 0.15)
    success = confidence >= 0.44 and cit_density >= 0.18
    return RetrievalSignalBundle(
        query_id=query_id,
        retrieval_success=success,
        confidence=confidence,
        citation_density=cit_density,
        graph_edges_used=list(graph_edges_used),
        reasoning_path=list(reasoning_path),
        token_efficiency=tok_eff,
        hallucination_risk=hall,
        graph_quality_score=gqs,
        retrieval_quality_score=rqs,
    )


async def record_retrieval_feedback_loop(
    session: AsyncSession,
    game_id: UUID,
    settings: Settings,
    *,
    question: str,
    intent: str,
    signals: RetrievalSignalBundle,
    graph_candidates: int,
    graph_limit: int,
    final_hits: int,
    vec_lex_overlap: float | None,
) -> dict[str, Any]:
    """Persiste feedback e opcionalmente reforça arestas (best-effort)."""
    drift = drift_metrics_bundle(
        graph_edges_used=signals.graph_edges_used,
        graph_candidates=graph_candidates,
        graph_limit=graph_limit,
        final_hits=final_hits,
        confidence=signals.confidence,
        vec_lex_overlap=vec_lex_overlap,
    )
    health = graph_health_summary(
        mean_reinforcement=signals.graph_quality_score,
        noise_ratio=estimate_noise_ratio(signals.confidence, graph_candidates, signals.token_efficiency),
        traversal_efficiency=estimate_traversal_efficiency(final_hits, graph_candidates),
    )
    out: dict[str, Any] = {"drift": drift, "graph_health": health}

    if not settings.feedback_persistence_enabled:
        return out

    try:
        await insert_retrieval_feedback_row(
            session,
            game_id=game_id,
            query_id=signals.query_id,
            query=question,
            intent=intent,
            graph_edges_used=signals.graph_edges_used,
            reasoning_path=signals.reasoning_path,
            final_confidence=signals.confidence,
            citation_quality=signals.citation_density,
            token_efficiency=signals.token_efficiency,
            retrieval_quality_score=signals.retrieval_quality_score,
            graph_quality_score=signals.graph_quality_score,
            hallucination_risk=signals.hallucination_risk,
            retrieval_success=signals.retrieval_success,
        )
        if settings.feedback_reinforcement_enabled and signals.graph_edges_used:
            n = await reinforce_edges(
                session,
                game_id,
                signals.graph_edges_used,
                success=signals.retrieval_success,
            )
            out["edges_reinforced"] = n
        await session.flush()
    except Exception as exc:  # pragma: no cover - schema antigo / permissões
        await session.rollback()
        logger.warning("feedback.persist_failed", error=str(exc))
        out["persist_error"] = str(exc)
    return out
