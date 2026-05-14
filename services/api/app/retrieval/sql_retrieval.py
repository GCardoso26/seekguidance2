"""Consultas SQL brutas: vetorial + lexical + filtros temporais versionados."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.retrieval.temporal_sql import temporal_sql_filter

_ALLOWED_DOC_TYPES = frozenset({"cr", "mtr", "ipg", "release_notes", "other"})


def vec_literal(vec: list[float]) -> str:
    return "[" + ",".join(str(float(x)) for x in vec) + "]"


def _doc_type_sql_filter(doc_types: tuple[str, ...] | list[str] | None) -> str:
    if not doc_types:
        return ""
    safe = [d for d in doc_types if d in _ALLOWED_DOC_TYPES]
    if not safe:
        return ""
    inner = ",".join("'" + d.replace("'", "") + "'" for d in safe)
    return f" AND d.doc_type IN ({inner}) "


async def search_vector_hits(
    session: AsyncSession,
    game_id: UUID,
    embedding_literal: str,
    *,
    limit: int,
    doc_types: tuple[str, ...] | list[str] | None = None,
    as_of: str | None = None,
    prefer_historical: bool = False,
) -> list[tuple[UUID, float]]:
    extra_doc = _doc_type_sql_filter(doc_types)
    extra_time, tparams = temporal_sql_filter(as_of=as_of, prefer_historical=prefer_historical)
    vec_sql = text(
        f"""
        SELECT c.id AS id, (c.embedding <=> CAST(:emb AS vector)) AS dist
        FROM tcg_judge.chunks c
        JOIN tcg_judge.documents d ON d.id = c.document_id
        WHERE d.game_id = :gid
          AND c.embedding IS NOT NULL
          {extra_doc}
          {extra_time}
        ORDER BY dist ASC
        LIMIT :lim
        """
    )
    params = {"gid": game_id, "emb": embedding_literal, "lim": limit, **tparams}
    rows = (await session.execute(vec_sql, params)).all()
    return [(row[0], float(row[1])) for row in rows]


async def search_lexical_hits(
    session: AsyncSession,
    game_id: UUID,
    question: str,
    *,
    limit: int,
    doc_types: tuple[str, ...] | list[str] | None = None,
    as_of: str | None = None,
    prefer_historical: bool = False,
) -> list[tuple[UUID, float]]:
    extra_doc = _doc_type_sql_filter(doc_types)
    extra_time, tparams = temporal_sql_filter(as_of=as_of, prefer_historical=prefer_historical)
    lex_sql = text(
        f"""
        SELECT c.id AS id,
               ts_rank_cd(
                   to_tsvector('english', c.text),
                   plainto_tsquery('english', :q)
               ) AS rank
        FROM tcg_judge.chunks c
        JOIN tcg_judge.documents d ON d.id = c.document_id
        WHERE d.game_id = :gid
          AND to_tsvector('english', c.text) @@ plainto_tsquery('english', :q)
          {extra_doc}
          {extra_time}
        ORDER BY rank DESC
        LIMIT :lim
        """
    )
    params = {"gid": game_id, "q": question, "lim": limit, **tparams}
    rows = (await session.execute(lex_sql, params)).all()
    return [(row[0], float(row[1])) for row in rows]
