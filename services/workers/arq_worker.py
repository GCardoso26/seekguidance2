"""Workers arq: download → parse/chunk/persist → embed."""

from __future__ import annotations

import os
import tempfile
from typing import Any
from urllib.parse import urlparse
from uuid import UUID

import structlog
from arq.connections import RedisSettings

logger = structlog.get_logger(__name__)


def _redis_settings() -> RedisSettings:
    raw = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    u = urlparse(raw)
    db = 0
    if u.path and u.path != "/":
        db = int(u.path.strip("/").split("/")[0] or "0")
    use_tls = u.scheme in ("rediss", "redis+ssl")
    return RedisSettings(
        host=u.hostname or "localhost",
        port=u.port or 6379,
        username=u.username,
        password=u.password,
        database=db,
        ssl=use_tls,
    )


def _pg_dsn() -> str:
    return os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


async def download_worker(ctx: dict[str, Any], url: str, doc_type: str, title: str, game_slug: str) -> None:
    from tcg_judge_ingestion.crawler.mtg_wizards import download_bytes, sha256_hex

    data, _mime = await download_bytes(url)
    h = sha256_hex(data)
    fd, path = tempfile.mkstemp(suffix=".pdf")
    import os as _os

    with _os.fdopen(fd, "wb") as f:
        f.write(data)
    await ctx["redis"].enqueue_job("parse_chunk_worker", path, doc_type, title, game_slug, url, h)
    logger.info("worker.download.done", sha256_prefix=h[:16])


async def parse_chunk_worker(
    ctx: dict[str, Any],
    path: str,
    doc_type: str,
    title: str,
    game_slug: str,
    url: str,
    content_hash: str,
) -> None:
    import os as _os

    from tcg_judge_ingestion.chunker.hierarchical_mtg import chunk_mtg_hierarchical
    from tcg_judge_ingestion.parser.pdf import extract_pdf_text
    from tcg_judge_ingestion.storage import mtg_repository as repo

    doc_id: UUID | None = None
    chunk_ids: list[UUID] = []
    try:
        with open(path, "rb") as f:
            data = f.read()
        text = extract_pdf_text(data)
        chunks = chunk_mtg_hierarchical(text, document_title=title)
        conn = await repo.connect(_pg_dsn())
        try:
            gid = await repo.get_game_id(conn, game_slug)
            if not gid:
                raise RuntimeError("game slug not found")
            doc_id = await repo.insert_document(
                conn,
                game_id=gid,
                doc_type=doc_type,
                title=title,
                source_url=url,
                publisher="Wizards of the Coast",
                content_hash=content_hash,
                raw_mime="application/pdf",
                metadata={"worker": "parse_chunk"},
            )
            await repo.delete_chunks_for_document(conn, doc_id)
            await repo.insert_document_version(
                conn, document_id=doc_id, content_hash=content_hash, version_label=None
            )
            chunk_ids = await repo.insert_chunks(
                conn, document_id=doc_id, chunks=chunks, version_label=None
            )
            await repo.backfill_parent_chunk_ids(conn, doc_id)
        finally:
            await conn.close()
    finally:
        _os.unlink(path)

    if doc_id is None:
        raise RuntimeError("parse_chunk_worker failed before document insert")
    await ctx["redis"].enqueue_job(
        "embed_worker", str(doc_id), [str(x) for x in chunk_ids]
    )
    logger.info("worker.parse.done", document_id=str(doc_id), n_chunks=len(chunk_ids))


async def embed_worker(ctx: dict[str, Any], document_id: str, chunk_ids: list[str]) -> None:
    from openai import AsyncOpenAI

    from tcg_judge_ingestion.storage import mtg_repository as repo

    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY missing")
    client = AsyncOpenAI(api_key=key)
    model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-large")
    dim = int(os.environ.get("OPENAI_EMBEDDING_DIMENSIONS", "1536"))
    did = UUID(document_id)

    conn = await repo.connect(_pg_dsn())
    try:
        for i in range(0, len(chunk_ids), 24):
            batch = chunk_ids[i : i + 24]
            texts: list[str] = []
            for cid in batch:
                row = await conn.fetchrow(
                    "SELECT text FROM tcg_judge.chunks WHERE id = $1::uuid", cid
                )
                texts.append(row["text"] if row else "")
            resp = await client.embeddings.create(
                model=model, input=texts, dimensions=dim
            )
            ordered = sorted(resp.data, key=lambda d: d.index)
            for cid, emb in zip(batch, ordered, strict=True):
                await repo.update_chunk_embedding(
                    conn, chunk_id=UUID(cid), embedding=list(emb.embedding)
                )
        await repo.mark_document_indexed(conn, did)
    finally:
        await conn.close()
    logger.info("worker.embed.done", document_id=document_id)


async def reindex_worker(ctx: dict[str, Any], document_id: str) -> None:
    logger.warning("reindex_worker.stub", document_id=document_id)


async def benchmark_worker(ctx: dict[str, Any], suite: str) -> None:
    logger.info("worker.benchmark.stub", suite=suite)


async def drift_worker(ctx: dict[str, Any], game_slug: str) -> None:
    logger.info("worker.drift.stub", game_slug=game_slug)


async def replay_worker(ctx: dict[str, Any], replay_hash: str) -> None:
    logger.info("worker.replay.stub", replay_hash_prefix=replay_hash[:16])


async def evaluation_worker(ctx: dict[str, Any], case_id: str) -> None:
    logger.info("worker.evaluation.stub", case_id=case_id)


async def graph_worker(ctx: dict[str, Any], game_slug: str, batch: list[str]) -> None:
    logger.info("worker.graph.stub", game_slug=game_slug, n_rules=len(batch))


async def chunk_queue_worker(ctx: dict[str, Any], document_id: str) -> None:
    logger.info("worker.chunk_queue.stub", document_id=document_id)


async def embedding_queue_worker(ctx: dict[str, Any], document_id: str) -> None:
    logger.info("worker.embedding_queue.stub", document_id=document_id)


async def dead_letter_worker(ctx: dict[str, Any], job_name: str, payload: dict[str, Any]) -> None:
    logger.warning("worker.dead_letter", job=job_name, payload_keys=list(payload.keys()))


class WorkerSettings:
    redis_settings = _redis_settings()
    functions = [
        download_worker,
        parse_chunk_worker,
        embed_worker,
        reindex_worker,
        graph_worker,
        evaluation_worker,
        drift_worker,
        replay_worker,
        benchmark_worker,
        chunk_queue_worker,
        embedding_queue_worker,
        dead_letter_worker,
    ]
