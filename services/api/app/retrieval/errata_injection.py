"""Injeção automática de errata no contexto de retrieval."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def inject_errata(
    chunks: list[Any],
    session: AsyncSession,
    game_slug: str,
    *,
    edge_confidence_threshold: float = 0.70,
) -> list[Any]:
    """
    Para cada chunk recuperado, verifica se existe errata mais recente (supersedes).
    Se sim, substitui o chunk pela errata e adiciona flag para o frontend.
    """
    enriched: list[Any] = []
    for chunk in chunks:
        chunk_id = getattr(chunk, "chunk_id", None) or (
            chunk.get("chunk_id") if isinstance(chunk, dict) else None
        )
        if chunk_id is None:
            enriched.append(chunk)
            continue

        src_rule = getattr(chunk, "rule_path", None) or (
            chunk.get("rule_path") if isinstance(chunk, dict) else None
        )
        try:
            row = (
                await session.execute(
                    text(
                        """
                        SELECT c.id AS chunk_id, c.text, c.rule_path, c.rule_atom,
                               c.document_id, d.title AS document_title, d.source_url
                        FROM tcg_judge.rule_graph_edges e
                        JOIN tcg_judge.chunks c ON (
                            c.rule_atom = e.dst_rule OR c.rule_path = e.dst_rule
                        )
                        JOIN tcg_judge.documents d ON d.id = c.document_id
                        JOIN tcg_judge.games g ON g.id = d.game_id
                        WHERE e.src_rule = :src_rule
                          AND e.relation = 'supersedes'
                          AND g.slug = :game_slug
                          AND COALESCE(
                            NULLIF(e.metadata->>'confidence','')::float, 0.85
                          ) >= :threshold
                        ORDER BY c.created_at DESC
                        LIMIT 1
                        """
                    ),
                    {
                        "src_rule": src_rule or "",
                        "game_slug": game_slug,
                        "threshold": edge_confidence_threshold,
                    },
                )
            ).mappings().first()
        except Exception:
            logger.warning("inject_errata.query_failed", exc_info=True)
            enriched.append(chunk)
            continue

        if not row:
            enriched.append(chunk)
            continue

        if hasattr(chunk, "chunk_id"):
            from app.retrieval.types import ChunkHit

            errata_hit = ChunkHit(
                chunk_id=row["chunk_id"],
                document_id=row["document_id"],
                text=row["text"] or "",
                rule_path=row.get("rule_path"),
                semantic_path=getattr(chunk, "semantic_path", None),
                parent_chunk_id=getattr(chunk, "parent_chunk_id", None),
                hierarchy_level=getattr(chunk, "hierarchy_level", 0),
                document_title=row.get("document_title") or getattr(chunk, "document_title", ""),
                source_url=row.get("source_url") or getattr(chunk, "source_url", ""),
                content_sha256=getattr(chunk, "content_sha256", None),
                version_label=getattr(chunk, "version_label", None),
                document_content_hash=getattr(chunk, "document_content_hash", None),
                metadata={
                    **(getattr(chunk, "metadata", {}) or {}),
                    "errata_supersedes": src_rule,
                    "source_type": "errata",
                },
                vector_score=getattr(chunk, "vector_score", 0.0),
                bm25_score=getattr(chunk, "bm25_score", 0.0),
                fused_score=getattr(chunk, "fused_score", 0.5),
                rerank_score=getattr(chunk, "rerank_score", None),
                temporal_score=getattr(chunk, "temporal_score", 0.0),
                expansion_source=getattr(chunk, "expansion_source", "atomic"),
            )
            logger.debug("Errata injetada: %s → %s", src_rule, row.get("rule_atom"))
            enriched.append(errata_hit)
        else:
            errata_dict = dict(chunk) if isinstance(chunk, dict) else {}
            errata_dict.update(
                {
                    "chunk_id": str(row["chunk_id"]),
                    "text": row["text"],
                    "rule_path": row.get("rule_path"),
                    "rule_atom": row.get("rule_atom"),
                    "errata_supersedes": src_rule,
                    "source_type": "errata",
                }
            )
            enriched.append(errata_dict)

    return enriched
