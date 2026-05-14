"""Persistência de arestas inferidas em `rule_graph_edges` (metadata rica)."""

from __future__ import annotations

import json
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.graph.relationship_extraction.schema import InferredRuleEdge


async def upsert_rule_graph_edges(
    session: AsyncSession,
    game_id: UUID,
    edges: list[InferredRuleEdge],
) -> int:
    """
    UPSERT por (game_id, src_rule, dst_rule, relation).
    Retorna número de linhas enviadas (não distingue insert vs update em todos os drivers).
    """
    if not edges:
        return 0
    sql = text(
        """
        INSERT INTO tcg_judge.rule_graph_edges (id, game_id, src_rule, dst_rule, relation, metadata)
        VALUES (:id, :game_id, :src, :dst, :rel, CAST(:meta AS jsonb))
        ON CONFLICT (game_id, src_rule, dst_rule, relation)
        DO UPDATE SET
            metadata = CAST(:meta AS jsonb)
        """
    )
    n = 0
    for e in edges:
        meta = {
            "confidence": e.confidence,
            "evidence": e.evidence,
            "relationship_score": e.relationship_score,
            **e.metadata,
        }
        await session.execute(
            sql,
            {
                "id": uuid4(),
                "game_id": game_id,
                "src": e.source_rule_id,
                "dst": e.target_rule_id,
                "rel": e.relationship_type,
                "meta": json.dumps(meta),
            },
        )
        n += 1
    return n
