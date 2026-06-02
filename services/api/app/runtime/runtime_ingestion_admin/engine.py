"""Administração remota de ingestão — jobs, reindex, upload PDF."""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

INGESTION_STAGES = ("crawling", "parsing", "chunking", "embeddings", "indexing", "validation")


async def list_ingestion_jobs(session: AsyncSession, limit: int = 50) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT id, game_id, status, crawler_key, payload, error, progress,
                           created_at, finished_at, started_at, updated_at, game_slug
                    FROM tcg_judge.ingestion_jobs
                    ORDER BY created_at DESC
                    LIMIT :limit
                    """
                ),
                {"limit": limit},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        logger.warning("list_ingestion_jobs_failed", exc_info=True)
        return []


async def ingestion_status_by_game(session: AsyncSession) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT
                        g.slug AS game_slug,
                        g.display_name,
                        COUNT(c.id)::int AS chunk_count,
                        COUNT(DISTINCT c.rule_atom) FILTER (WHERE c.rule_atom IS NOT NULL)::int AS rule_atoms,
                        MAX(d.indexed_at) AS last_indexed_at,
                        MAX(c.created_at) AS last_chunk_at,
                        COUNT(d.id)::int AS document_count
                    FROM tcg_judge.games g
                    LEFT JOIN tcg_judge.documents d ON d.game_id = g.id
                    LEFT JOIN tcg_judge.chunks c ON c.document_id = d.id
                    WHERE g.enabled = true
                    GROUP BY g.slug, g.display_name
                    ORDER BY g.display_name
                    """
                )
            )
        ).mappings().all()
        out: list[dict[str, Any]] = []
        for r in rows:
            chunk_count = int(r["chunk_count"] or 0)
            rag_ready = chunk_count >= 1
            coverage = min(100.0, chunk_count / 100.0 * 100) if chunk_count else 0.0
            out.append(
                {
                    "game_slug": str(r["game_slug"]),
                    "display_name": str(r["display_name"]),
                    "chunk_count": chunk_count,
                    "rule_atoms": int(r["rule_atoms"] or 0),
                    "corpus_size": int(r["document_count"] or 0),
                    "rag_ready": rag_ready,
                    "coverage_pct": round(coverage, 1),
                    "last_indexed_at": _iso(r.get("last_indexed_at")),
                    "last_chunk_at": _iso(r.get("last_chunk_at")),
                }
            )
        return out
    except Exception:
        logger.warning("ingestion_status_failed", exc_info=True)
        return []


async def enqueue_reindex(
    session: AsyncSession,
    *,
    game_slug: str,
    actor: str | None = None,
) -> dict[str, Any]:
    slug = game_slug.strip().lower()
    row = (
        await session.execute(
            text("SELECT id FROM tcg_judge.games WHERE slug = :slug AND enabled = true LIMIT 1"),
            {"slug": slug},
        )
    ).first()
    if not row:
        return {"error": f"Jogo '{slug}' não encontrado", "status": "failed"}
    game_id = str(row[0])
    job_id = str(uuid.uuid4())
    progress = {"stage": "queued", "percent": 0, "stages": list(INGESTION_STAGES)}
    try:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.ingestion_jobs
                  (id, game_id, status, crawler_key, payload, progress, game_slug, started_at)
                VALUES
                  (CAST(:id AS uuid), CAST(:game_id AS uuid), 'pending', 'reindex',
                   CAST(:payload AS jsonb), CAST(:progress AS jsonb), :game_slug, now())
                """
            ),
            {
                "id": job_id,
                "game_id": game_id,
                "payload": json.dumps({"game_slug": slug, "requested_by": actor}),
                "progress": json.dumps(progress),
                "game_slug": slug,
            },
        )
        await session.commit()
        return {"job_id": job_id, "status": "pending", "game_slug": slug}
    except Exception as exc:
        logger.warning("enqueue_reindex_failed", error=str(exc))
        await session.rollback()
        return {"error": str(exc), "status": "failed"}


async def store_uploaded_pdf_metadata(
    session: AsyncSession,
    *,
    game_slug: str,
    filename: str,
    content: bytes,
    uploaded_by: str | None,
    pages: int | None = None,
    chunk_count: int = 0,
) -> dict[str, Any]:
    checksum = hashlib.sha256(content).hexdigest()
    doc_id = str(uuid.uuid4())
    try:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.uploaded_documents
                  (id, game_slug, filename, checksum, pages, chunk_count, source_type, uploaded_by, metadata)
                VALUES
                  (CAST(:id AS uuid), :game_slug, :filename, :checksum, :pages, :chunk_count,
                   'local_document', :uploaded_by, CAST(:metadata AS jsonb))
                """
            ),
            {
                "id": doc_id,
                "game_slug": game_slug.strip().lower(),
                "filename": filename,
                "checksum": checksum,
                "pages": pages,
                "chunk_count": chunk_count,
                "uploaded_by": uploaded_by,
                "metadata": json.dumps({"size_bytes": len(content)}),
            },
        )
        await session.commit()
        return {"id": doc_id, "checksum": checksum, "filename": filename, "game_slug": game_slug}
    except Exception as exc:
        await session.rollback()
        return {"error": str(exc)}


def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)
