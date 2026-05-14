"""Expansão parent-aware e siblings (ancestry + mesmo parent_chunk_id)."""

from __future__ import annotations

from typing import Any
from uuid import UUID

import structlog
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.retrieval.types import ChunkHit

logger = structlog.get_logger(__name__)


async def fetch_embeddings_for(
    session: AsyncSession,
    chunk_ids: list[UUID],
) -> dict[UUID, list[float]]:
    if not chunk_ids:
        return {}
    q = text(
        """
        SELECT id, embedding::text AS emb
        FROM tcg_judge.chunks
        WHERE id IN :ids AND embedding IS NOT NULL
        """
    ).bindparams(bindparam("ids", expanding=True))
    rows = (await session.execute(q, {"ids": chunk_ids})).mappings().all()
    out: dict[UUID, list[float]] = {}
    for r in rows:
        raw = r["emb"]
        if raw is None or raw == "NULL":
            continue
        if isinstance(raw, list | tuple):
            out[r["id"]] = [float(x) for x in raw]
            continue
        s = str(raw).strip()
        if s.startswith("[") and s.endswith("]"):
            inner = s[1:-1]
            parts = [float(x) for x in inner.split(",") if x.strip()]
            out[r["id"]] = parts
    return out


def _row_to_hit(
    r: dict[str, Any],
    *,
    fused_score: float,
    expansion_source: str,
) -> ChunkHit:
    meta_raw = r.get("metadata") or {}
    meta = dict(meta_raw) if isinstance(meta_raw, dict) else {}
    if r.get("doc_type"):
        meta["doc_type"] = r["doc_type"]
    if r.get("chunk_created_at") is not None:
        meta["chunk_created_at"] = str(r["chunk_created_at"])
    return ChunkHit(
        chunk_id=r["id"],
        document_id=r["document_id"],
        text=r["text"],
        rule_path=r.get("rule_path"),
        semantic_path=r.get("semantic_path"),
        parent_chunk_id=r.get("parent_chunk_id"),
        hierarchy_level=int(r.get("hierarchy_level") or 0),
        document_title=r["title"],
        source_url=r["source_url"],
        content_sha256=r.get("content_sha256"),
        version_label=r.get("version_label"),
        document_content_hash=r.get("content_hash"),
        metadata=meta,
        vector_score=float(r.get("vector_score") or 0.0),
        bm25_score=float(r.get("bm25_score") or 0.0),
        fused_score=fused_score,
        rerank_score=None,
        temporal_score=0.0,
        expansion_source=expansion_source,
    )


async def fetch_chunk_rows(
    session: AsyncSession,
    ids: list[UUID],
    *,
    score_defaults: dict[UUID, tuple[float, float, float]] | None = None,
) -> dict[UUID, dict[str, Any]]:
    """Carrega metadados completos para um conjunto de chunk ids."""
    if not ids:
        return {}
    q = text(
        """
        SELECT
            c.id,
            c.document_id,
            c.text,
            c.rule_path,
            c.semantic_path,
            c.parent_chunk_id,
            c.hierarchy_level,
            c.content_sha256,
            c.version_label,
            c.metadata,
            c.created_at AS chunk_created_at,
            d.title,
            d.source_url,
            d.content_hash,
            d.doc_type,
            (SELECT dv.effective_from FROM tcg_judge.document_versions dv
             WHERE dv.document_id = d.id AND dv.content_hash = d.content_hash
             ORDER BY dv.effective_from DESC NULLS LAST LIMIT 1) AS version_effective_from,
            (SELECT dv.effective_to FROM tcg_judge.document_versions dv
             WHERE dv.document_id = d.id AND dv.content_hash = d.content_hash
             ORDER BY dv.effective_from DESC NULLS LAST LIMIT 1) AS version_effective_to
        FROM tcg_judge.chunks c
        JOIN tcg_judge.documents d ON d.id = c.document_id
        WHERE c.id IN :ids
        """
    ).bindparams(bindparam("ids", expanding=True))
    rows = (await session.execute(q, {"ids": ids})).mappings().all()
    by_id: dict[UUID, dict[str, Any]] = {}
    for r in rows:
        rid = r["id"]
        row = dict(r)
        if score_defaults and rid in score_defaults:
            vs, bs, fs = score_defaults[rid]
            row["vector_score"] = vs
            row["bm25_score"] = bs
            row["fused_score"] = fs
        by_id[rid] = row
    return by_id


async def expand_ancestry(
    session: AsyncSession,
    seed: ChunkHit,
    *,
    max_depth: int = 12,
) -> list[ChunkHit]:
    """Sobe a cadeia parent_chunk_id até a raiz."""
    q = text(
        """
        WITH RECURSIVE up AS (
            SELECT
                c.id, c.document_id, c.text, c.rule_path, c.semantic_path,
                c.parent_chunk_id, c.hierarchy_level, c.content_sha256, c.version_label,
                c.metadata, c.created_at AS chunk_created_at,
                d.title, d.source_url, d.content_hash, d.doc_type, 0 AS _depth
            FROM tcg_judge.chunks c
            JOIN tcg_judge.documents d ON d.id = c.document_id
            WHERE c.id = :cid
            UNION ALL
            SELECT
                c.id, c.document_id, c.text, c.rule_path, c.semantic_path,
                c.parent_chunk_id, c.hierarchy_level, c.content_sha256, c.version_label,
                c.metadata, c.created_at AS chunk_created_at,
                d.title, d.source_url, d.content_hash, d.doc_type, up._depth + 1 AS _depth
            FROM tcg_judge.chunks c
            JOIN tcg_judge.documents d ON d.id = c.document_id
            JOIN up ON c.id = up.parent_chunk_id
            WHERE up.parent_chunk_id IS NOT NULL
              AND up._depth < :maxd
        )
        SELECT id, document_id, text, rule_path, semantic_path, parent_chunk_id,
               hierarchy_level, content_sha256, version_label, metadata,
               chunk_created_at, doc_type,
               title, source_url, content_hash, _depth
        FROM up
        WHERE id <> :cid
        ORDER BY _depth DESC
        """
    )
    rows = (await session.execute(q, {"cid": seed.chunk_id, "maxd": max_depth})).mappings().all()
    parents: list[ChunkHit] = []
    base = max(seed.fused_score, 1e-6)
    for i, r in enumerate(rows):
        damp = 0.92 ** (i + 1)
        fused = base * damp
        parents.append(
            _row_to_hit(
                {
                    "id": r["id"],
                    "document_id": r["document_id"],
                    "text": r["text"],
                    "rule_path": r.get("rule_path"),
                    "semantic_path": r.get("semantic_path"),
                    "parent_chunk_id": r.get("parent_chunk_id"),
                    "hierarchy_level": r.get("hierarchy_level"),
                    "content_sha256": r.get("content_sha256"),
                    "version_label": r.get("version_label"),
                    "metadata": r.get("metadata"),
                    "title": r["title"],
                    "source_url": r["source_url"],
                    "content_hash": r.get("content_hash"),
                    "doc_type": r.get("doc_type"),
                    "chunk_created_at": r.get("chunk_created_at"),
                    "vector_score": seed.vector_score * damp,
                    "bm25_score": seed.bm25_score * damp,
                },
                fused_score=fused,
                expansion_source="parent",
            )
        )
    return parents


async def expand_siblings(
    session: AsyncSession,
    seed: ChunkHit,
    *,
    limit: int = 6,
) -> list[ChunkHit]:
    """Chunks com o mesmo parent_chunk_id (excluindo o seed)."""
    if seed.parent_chunk_id is None:
        return []
    q = text(
        """
        SELECT c.id, c.document_id, c.text, c.rule_path, c.semantic_path,
               c.parent_chunk_id, c.hierarchy_level, c.content_sha256, c.version_label,
               c.metadata, c.created_at AS chunk_created_at,
               d.title, d.source_url, d.content_hash, d.doc_type
        FROM tcg_judge.chunks c
        JOIN tcg_judge.documents d ON d.id = c.document_id
        WHERE c.document_id = :did
          AND c.parent_chunk_id = :pid
          AND c.id <> :sid
        ORDER BY c.chunk_index ASC
        LIMIT :lim
        """
    )
    rows = (
        (
            await session.execute(
                q,
                {
                    "did": seed.document_id,
                    "pid": seed.parent_chunk_id,
                    "sid": seed.chunk_id,
                    "lim": limit,
                },
            )
        )
        .mappings()
        .all()
    )
    base = max(seed.fused_score, 1e-6) * 0.88
    out: list[ChunkHit] = []
    for r in rows:
        out.append(
            _row_to_hit(
                dict(r),
                fused_score=base,
                expansion_source="sibling",
            )
        )
    return out


async def expand_context(
    session: AsyncSession,
    seeds: list[ChunkHit],
    *,
    max_ancestors: int,
    max_siblings_per_seed: int,
) -> list[ChunkHit]:
    """
    Para cada seed: ancestrais + siblings; merge por id (mantém maior fused_score).
    """
    merged: dict[UUID, ChunkHit] = {h.chunk_id: h for h in seeds}

    for seed in seeds:
        try:
            parents = await expand_ancestry(session, seed, max_depth=max_ancestors)
            sibs = await expand_siblings(session, seed, limit=max_siblings_per_seed)
        except Exception as exc:  # pragma: no cover
            logger.warning("retrieval.expansion.failed", error=str(exc), seed=str(seed.chunk_id))
            continue
        for h in parents + sibs:
            cur = merged.get(h.chunk_id)
            if cur is None or h.fused_score > cur.fused_score:
                merged[h.chunk_id] = h

    return sorted(merged.values(), key=lambda x: -x.fused_score)
