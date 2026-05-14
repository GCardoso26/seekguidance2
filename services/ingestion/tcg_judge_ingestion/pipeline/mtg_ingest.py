"""Orquestração ponta-a-ponta: download → parse → chunk → persist → embed."""

from __future__ import annotations

import structlog

from tcg_judge_ingestion.chunker.hierarchical_mtg import chunk_mtg_hierarchical
from tcg_judge_ingestion.crawler.mtg_wizards import download_bytes, sha256_hex
from tcg_judge_ingestion.embeddings.openai_provider import OpenAIEmbeddingProvider
from tcg_judge_ingestion.parser.pdf import extract_pdf_text
from tcg_judge_ingestion.storage import mtg_repository as repo

logger = structlog.get_logger(__name__)


async def ingest_pdf_url(
    dsn: str,
    *,
    game_slug: str,
    doc_type: str,
    title: str,
    url: str,
    openai_api_key: str,
    publisher: str = "Wizards of the Coast",
) -> str:
    conn = await repo.connect(dsn.replace("+asyncpg", ""))
    try:
        gid = await repo.get_game_id(conn, game_slug)
        if gid is None:
            raise RuntimeError(f"game not found: {game_slug}")

        data, mime = await download_bytes(url)
        h = sha256_hex(data)
        doc_id = await repo.insert_document(
            conn,
            game_id=gid,
            doc_type=doc_type,
            title=title,
            source_url=url,
            publisher=publisher,
            content_hash=h,
            raw_mime=mime,
            metadata={"ingestion": "mtg_wizards", "sha256": h},
        )
        await repo.delete_chunks_for_document(conn, doc_id)
        text = extract_pdf_text(data)
        chunks = chunk_mtg_hierarchical(text, document_title=title)
        await repo.insert_document_version(
            conn, document_id=doc_id, content_hash=h, version_label=None
        )
        chunk_ids = await repo.insert_chunks(
            conn, document_id=doc_id, chunks=chunks, version_label=None
        )
        await repo.backfill_parent_chunk_ids(conn, doc_id)

        embedder = OpenAIEmbeddingProvider(openai_api_key)
        batch_size = 32
        for i in range(0, len(chunks), batch_size):
            sl = chunks[i : i + batch_size]
            ids = chunk_ids[i : i + batch_size]
            vectors = await embedder.embed_batch([c.text for c in sl])
            for cid, vec in zip(ids, vectors, strict=True):
                await repo.update_chunk_embedding(conn, chunk_id=cid, embedding=vec)

        await repo.mark_document_indexed(conn, doc_id)
        logger.info("ingest.complete", document_id=str(doc_id), chunks=len(chunks))
        return str(doc_id)
    finally:
        await conn.close()
