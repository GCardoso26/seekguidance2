"""Diagnóstico de erros de documentos na ingestão."""

from __future__ import annotations

import json
import traceback
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


async def record_document_error(
    session: AsyncSession,
    *,
    game_slug: str,
    stage: str,
    exception: BaseException,
    filename: str | None = None,
    document_id: str | None = None,
    chunk_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    try:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.document_errors
                  (game_slug, document_id, filename, stage, exception, stacktrace, chunk_id, details)
                VALUES
                  (:game_slug, CAST(:document_id AS uuid), :filename, :stage, :exception,
                   :stacktrace, CAST(:chunk_id AS uuid), CAST(:details AS jsonb))
                """
            ),
            {
                "game_slug": game_slug,
                "document_id": document_id,
                "filename": filename,
                "stage": stage,
                "exception": str(exception)[:2000],
                "stacktrace": traceback.format_exc()[:8000],
                "chunk_id": chunk_id,
                "details": json.dumps(details or {}),
            },
        )
        await session.commit()
    except Exception:
        logger.warning("record_document_error_failed", exc_info=True)
        try:
            await session.rollback()
        except Exception:
            pass


async def list_document_errors(
    session: AsyncSession,
    *,
    game_slug: str | None = None,
    stage: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    clauses = ["1=1"]
    params: dict[str, Any] = {"limit": limit}
    if game_slug:
        clauses.append("game_slug = :game_slug")
        params["game_slug"] = game_slug.strip().lower()
    if stage:
        clauses.append("stage = :stage")
        params["stage"] = stage
    where = " AND ".join(clauses)
    try:
        rows = (
            await session.execute(
                text(
                    f"""
                    SELECT id, game_slug, document_id, filename, stage, exception,
                           stacktrace, chunk_id, details, created_at
                    FROM tcg_judge.document_errors
                    WHERE {where}
                    ORDER BY created_at DESC
                    LIMIT :limit
                    """
                ),
                params,
            )
        ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        logger.warning("list_document_errors_failed", exc_info=True)
        return []
