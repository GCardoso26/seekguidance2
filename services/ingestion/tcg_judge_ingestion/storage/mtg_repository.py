"""Persistência asyncpg (schema tcg_judge) — documentos e chunks."""

from __future__ import annotations

import json
from typing import Any
from uuid import UUID

import asyncpg
import structlog

from tcg_judge_ingestion.chunker.hierarchical_mtg import HierarchicalChunk

logger = structlog.get_logger(__name__)


async def connect(dsn: str) -> asyncpg.Connection:
    return await asyncpg.connect(dsn)


async def get_game_id(conn: asyncpg.Connection, slug: str) -> UUID | None:
    row = await conn.fetchrow(
        "SELECT id FROM tcg_judge.games WHERE slug = $1 AND enabled = true",
        slug,
    )
    return row["id"] if row else None


async def insert_document(
    conn: asyncpg.Connection,
    *,
    game_id: UUID,
    doc_type: str,
    title: str,
    source_url: str,
    publisher: str,
    content_hash: str,
    raw_mime: str,
    metadata: dict[str, Any],
) -> UUID:
    row = await conn.fetchrow(
        """
        INSERT INTO tcg_judge.documents (
            game_id, doc_type, title, source_url, publisher, language,
            content_hash, raw_mime, metadata
        ) VALUES ($1,$2,$3,$4,$5,'en',$6,$7,$8::jsonb)
        ON CONFLICT (game_id, source_url, content_hash)
        DO UPDATE SET title = EXCLUDED.title, fetched_at = now()
        RETURNING id
        """,
        game_id,
        doc_type,
        title,
        source_url,
        publisher,
        content_hash,
        raw_mime,
        json.dumps(metadata),
    )
    assert row is not None
    return row["id"]


async def insert_document_version(
    conn: asyncpg.Connection,
    *,
    document_id: UUID,
    content_hash: str,
    version_label: str | None,
) -> None:
    await conn.execute(
        """
        INSERT INTO tcg_judge.document_versions (document_id, content_hash, version_label)
        VALUES ($1, $2, $3)
        """,
        document_id,
        content_hash,
        version_label,
    )


async def delete_chunks_for_document(conn: asyncpg.Connection, document_id: UUID) -> None:
    await conn.execute("DELETE FROM tcg_judge.chunks WHERE document_id = $1", document_id)


async def insert_chunks(
    conn: asyncpg.Connection,
    *,
    document_id: UUID,
    chunks: list[HierarchicalChunk],
    version_label: str | None,
) -> list[UUID]:
    ids: list[UUID] = []
    for ch in chunks:
        meta = {
            **ch.metadata,
            "parent_rule_path": ch.parent_rule_path,
            "semantic_path": ch.semantic_path,
        }
        row = await conn.fetchrow(
            """
            INSERT INTO tcg_judge.chunks (
                document_id, chunk_index, section_path, text, token_count,
                metadata, rule_path, parent_rule_path, hierarchy_level,
                title, subsection, semantic_path, content_sha256, version_label
            ) VALUES (
                $1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14
            )
            RETURNING id
            """,
            document_id,
            ch.chunk_index,
            ch.rule_path or ch.semantic_path,
            ch.text,
            ch.token_count,
            json.dumps(meta),
            ch.rule_path,
            ch.parent_rule_path,
            ch.hierarchy_level,
            ch.title,
            None,
            ch.semantic_path,
            ch.content_sha256,
            version_label,
        )
        assert row is not None
        ids.append(row["id"])
    return ids


async def backfill_parent_chunk_ids(conn: asyncpg.Connection, document_id: UUID) -> None:
    await conn.execute(
        """
        UPDATE tcg_judge.chunks AS c
        SET parent_chunk_id = p.id
        FROM tcg_judge.chunks AS p
        WHERE c.document_id = $1
          AND p.document_id = $1
          AND c.parent_rule_path IS NOT NULL
          AND p.rule_path = c.parent_rule_path
          AND c.id <> p.id
        """,
        document_id,
    )


async def update_chunk_embedding(
    conn: asyncpg.Connection,
    *,
    chunk_id: UUID,
    embedding: list[float],
) -> None:
    vec = "[" + ",".join(str(float(x)) for x in embedding) + "]"
    await conn.execute(
        "UPDATE tcg_judge.chunks SET embedding = $2::vector WHERE id = $1",
        chunk_id,
        vec,
    )


async def mark_document_indexed(conn: asyncpg.Connection, document_id: UUID) -> None:
    await conn.execute(
        "UPDATE tcg_judge.documents SET indexed_at = now() WHERE id = $1",
        document_id,
    )
