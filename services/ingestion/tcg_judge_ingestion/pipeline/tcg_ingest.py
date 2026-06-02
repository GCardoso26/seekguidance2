"""Ingestão PDF genérica: download → parse → chunk → persist → embed."""

from __future__ import annotations

from pathlib import Path

import structlog

from tcg_judge_ingestion.chunker.hierarchical_generic import chunk_generic_hierarchical
from tcg_judge_ingestion.chunker.hierarchical_mtg import HierarchicalChunk, chunk_mtg_hierarchical
from tcg_judge_ingestion.crawler.mtg_wizards import download_bytes, download_pdf_bytes, sha256_hex
from tcg_judge_ingestion.crawler.tcg_official_sources import OfficialPdf
from tcg_judge_ingestion.embeddings.openai_provider import OpenAIEmbeddingProvider
from tcg_judge_ingestion.parser.html import html_to_text
from tcg_judge_ingestion.parser.pdf import extract_pdf_text
from tcg_judge_ingestion.cache_invalidation import invalidate_judge_semantic_cache
from tcg_judge_ingestion.storage import mtg_repository as repo

logger = structlog.get_logger(__name__)

_STRUCTURED_RULE_GAMES = frozenset(
    {"mtg", "pokemon", "yugioh", "lorcana", "onepiece", "fab", "vanguard", "digimon"}
)


def _chunker_for_game(game_slug: str):
    if game_slug in _STRUCTURED_RULE_GAMES:
        from tcg_judge_ingestion.chunking.rule_parser import (
            chunk_by_rule_hierarchy,
            rule_chunks_to_hierarchical,
        )

        def _structured(text: str, title: str) -> list[HierarchicalChunk]:
            rules = chunk_by_rule_hierarchy(text, game_slug)
            return rule_chunks_to_hierarchical(rules, document_title=title)

        return _structured
    if game_slug == "mtg":
        return lambda text, title: chunk_mtg_hierarchical(text, document_title=title)
    return lambda text, title: chunk_generic_hierarchical(text, document_title=title)


async def _ingest_pdf_data(
    dsn: str,
    *,
    game_slug: str,
    doc_type: str,
    title: str,
    data: bytes,
    source_url: str,
    openai_api_key: str,
    publisher: str,
    mime: str = "application/pdf",
    ingestion_tag: str | None = None,
    extra_metadata: dict | None = None,
) -> str:
    conn = await repo.connect(dsn.replace("+asyncpg", ""))
    tag = ingestion_tag or f"tcg_{game_slug}"
    meta = {"ingestion": tag, "game_slug": game_slug, **(extra_metadata or {})}
    try:
        gid = await repo.get_game_id(conn, game_slug)
        if gid is None:
            raise RuntimeError(f"game not found in DB (seed games.slug): {game_slug}")

        h = sha256_hex(data)
        meta["sha256"] = h
        doc_id = await repo.insert_document(
            conn,
            game_id=gid,
            doc_type=doc_type,
            title=title,
            source_url=source_url,
            publisher=publisher,
            content_hash=h,
            raw_mime=mime,
            metadata=meta,
        )
        await repo.delete_chunks_for_document(conn, doc_id)
        text = extract_pdf_text(data)
        chunk_fn = _chunker_for_game(game_slug)
        chunks = chunk_fn(text, title)
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
        invalidate_judge_semantic_cache(game_slug)
        logger.info(
            "ingest.complete",
            game_slug=game_slug,
            doc_type=doc_type,
            document_id=str(doc_id),
            chunks=len(chunks),
        )
        return str(doc_id)
    finally:
        await conn.close()


async def ingest_pdf_file(
    dsn: str,
    *,
    path: str | Path,
    game_slug: str,
    doc_type: str,
    title: str,
    openai_api_key: str,
    publisher: str,
    source_url: str | None = None,
    ingestion_tag: str | None = None,
) -> str:
    file_path = Path(path).expanduser().resolve()
    if not file_path.is_file():
        raise FileNotFoundError(f"PDF não encontrado: {file_path}")
    data = file_path.read_bytes()
    if not data.startswith(b"%PDF-"):
        raise ValueError(f"Ficheiro não é PDF válido: {file_path}")
    return await _ingest_pdf_data(
        dsn,
        game_slug=game_slug,
        doc_type=doc_type,
        title=title,
        data=data,
        source_url=source_url or f"file://{file_path}",
        openai_api_key=openai_api_key,
        publisher=publisher,
        ingestion_tag=ingestion_tag,
        extra_metadata={"local_path": str(file_path)},
    )


async def ingest_pdf_url(
    dsn: str,
    *,
    game_slug: str,
    doc_type: str,
    title: str,
    url: str,
    openai_api_key: str,
    publisher: str,
    ingestion_tag: str | None = None,
    fallback_urls: tuple[str, ...] = (),
    download_referer: str | None = None,
    download_warmup_url: str | None = None,
) -> str:
    data, mime = await download_pdf_bytes(
        url,
        fallback_urls=fallback_urls,
        referer=download_referer,
        warmup_url=download_warmup_url,
    )
    return await _ingest_pdf_data(
        dsn,
        game_slug=game_slug,
        doc_type=doc_type,
        title=title,
        data=data,
        source_url=url,
        openai_api_key=openai_api_key,
        publisher=publisher,
        mime=mime,
        ingestion_tag=ingestion_tag,
    )


async def ingest_html_url(
    dsn: str,
    *,
    game_slug: str,
    doc_type: str,
    title: str,
    url: str,
    openai_api_key: str,
    publisher: str,
    ingestion_tag: str | None = None,
) -> str:
    conn = await repo.connect(dsn.replace("+asyncpg", ""))
    tag = ingestion_tag or f"tcg_{game_slug}"
    try:
        gid = await repo.get_game_id(conn, game_slug)
        if gid is None:
            raise RuntimeError(f"game not found in DB (seed games.slug): {game_slug}")

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
            raw_mime=mime or "text/html",
            metadata={"ingestion": tag, "sha256": h, "game_slug": game_slug, "format": "html"},
        )
        await repo.delete_chunks_for_document(conn, doc_id)
        charset = "utf-8"
        if "charset=" in (mime or "").lower():
            charset = mime.split("charset=")[-1].strip() or charset
        text = html_to_text(data.decode(charset, errors="replace"))
        if len(text.strip()) < 200:
            raise ValueError(f"HTML sem texto suficiente de {url!r} (len={len(text.strip())})")
        chunk_fn = _chunker_for_game(game_slug)
        chunks = chunk_fn(text, title)
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
        logger.info(
            "ingest.complete",
            game_slug=game_slug,
            doc_type=doc_type,
            document_id=str(doc_id),
            chunks=len(chunks),
            format="html",
        )
        return str(doc_id)
    finally:
        await conn.close()


async def ingest_official(
    dsn: str,
    *,
    game_slug: str,
    source: OfficialPdf,
    openai_api_key: str,
    ingestion_tag: str | None = None,
    ingest_root: str | Path = "data/ingest",
) -> str:
    if source.kind == "pdf":
        from tcg_judge_ingestion.crawler.tcg_official_sources import (
            LOCAL_PDF_ONLY,
            local_ingest_hint,
            resolve_ingest_game_slug,
            resolve_local_pdf,
        )

        slug = resolve_ingest_game_slug(game_slug)
        local = resolve_local_pdf(slug, source.doc_type, ingest_root=ingest_root)
        if local is not None:
            logger.info("ingest.local_pdf", path=str(local), doc_type=source.doc_type)
            return await ingest_pdf_file(
                dsn,
                path=local,
                game_slug=slug,
                doc_type=source.doc_type,
                title=source.title,
                openai_api_key=openai_api_key,
                publisher=source.publisher,
                source_url=source.url,
                ingestion_tag=ingestion_tag,
            )
        if (slug, source.doc_type) in LOCAL_PDF_ONLY:
            raise FileNotFoundError(local_ingest_hint(slug, source.doc_type, ingest_root=ingest_root))
    if source.kind == "html":
        return await ingest_html_url(
            dsn,
            game_slug=game_slug,
            doc_type=source.doc_type,
            title=source.title,
            url=source.url,
            openai_api_key=openai_api_key,
            publisher=source.publisher,
            ingestion_tag=ingestion_tag,
        )
    return await ingest_pdf_url(
        dsn,
        game_slug=game_slug,
        doc_type=source.doc_type,
        title=source.title,
        url=source.url,
        openai_api_key=openai_api_key,
        publisher=source.publisher,
        ingestion_tag=ingestion_tag,
        fallback_urls=source.fallback_urls,
        download_referer=source.download_referer,
        download_warmup_url=source.download_warmup_url,
    )
