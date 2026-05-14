"""Persistência de feedback de retrieval + leitura de histórico para expansão adaptativa."""

from __future__ import annotations

import json
import uuid
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def fetch_retrieval_quality_ema(
    session: AsyncSession,
    game_id: UUID,
    *,
    window: int = 50,
) -> float | None:
    """Média simples dos últimos `window` scores de qualidade (None se tabela vazia / erro)."""
    q = text(
        """
        SELECT AVG(retrieval_quality_score) AS ema
        FROM (
            SELECT retrieval_quality_score
            FROM tcg_judge.retrieval_feedback
            WHERE game_id = :gid
              AND retrieval_quality_score IS NOT NULL
            ORDER BY created_at DESC
            LIMIT :lim
        ) t
        """
    )
    try:
        row = (await session.execute(q, {"gid": game_id, "lim": window})).one_or_none()
        if row is None or row[0] is None:
            return None
        return float(row[0])
    except Exception:
        return None


async def insert_retrieval_feedback_row(
    session: AsyncSession,
    *,
    game_id: UUID,
    query_id: UUID | None,
    query: str,
    intent: str,
    graph_edges_used: list[str],
    reasoning_path: list[str],
    final_confidence: float,
    citation_quality: float | None,
    token_efficiency: float | None,
    retrieval_quality_score: float | None,
    graph_quality_score: float | None,
    hallucination_risk: float | None,
    retrieval_success: bool,
) -> None:
    sql = text(
        """
        INSERT INTO tcg_judge.retrieval_feedback (
            id, game_id, query_id, query, intent,
            graph_edges_used, retrieval_reasoning_path,
            final_confidence, citation_quality, token_efficiency,
            retrieval_quality_score, graph_quality_score,
            hallucination_risk, retrieval_success
        ) VALUES (
            :id, :gid, :qid, :q, :intent,
            CAST(:edges AS jsonb), CAST(:path AS jsonb),
            :conf, :cit, :tok,
            :rqs, :gqs, :hall, :ok
        )
        """
    )
    await session.execute(
        sql,
        {
            "id": uuid.uuid4(),
            "gid": game_id,
            "qid": query_id,
            "q": query[:4000],
            "intent": intent[:120],
            "edges": json.dumps(graph_edges_used),
            "path": json.dumps(reasoning_path),
            "conf": float(final_confidence),
            "cit": citation_quality,
            "tok": token_efficiency,
            "rqs": retrieval_quality_score,
            "gqs": graph_quality_score,
            "hall": hallucination_risk,
            "ok": retrieval_success,
        },
    )
