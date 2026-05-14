"""CLI: ingestão MTG (requer DATABASE_URL sync DSN e OPENAI_API_KEY)."""

from __future__ import annotations

import argparse
import asyncio
import os

import structlog

from tcg_judge_ingestion.crawler.mtg_wizards import discover_mtg_official_pdfs
from tcg_judge_ingestion.pipeline.mtg_ingest import ingest_pdf_url


def _to_asyncpg_dsn(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://")


async def _main() -> None:
    structlog.configure(processors=[structlog.processors.JSONRenderer()])
    p = argparse.ArgumentParser()
    p.add_argument("--game", default="mtg")
    p.add_argument("--only", choices=("CR", "MTR", "IPG", "RELEASE", "ALL"), default="CR")
    p.add_argument("--url", default=None, help="PDF direto (ignora descoberta)")
    p.add_argument("--doc-type", default="CR")
    p.add_argument("--title", default="Magic Comprehensive Rules")
    args = p.parse_args()

    dsn = os.environ.get("DATABASE_URL", "")
    if not dsn:
        raise SystemExit("DATABASE_URL obrigatório")
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key:
        raise SystemExit("OPENAI_API_KEY obrigatório para embeddings")

    dsn_pg = _to_asyncpg_dsn(dsn)

    if args.url:
        await ingest_pdf_url(
            dsn_pg,
            game_slug=args.game,
            doc_type=args.doc_type,
            title=args.title,
            url=args.url,
            openai_api_key=key,
        )
        return

    found = await discover_mtg_official_pdfs()
    if args.only != "ALL":
        found = [d for d in found if d.doc_type == args.only]
    if not found:
        raise SystemExit(
            "Nenhum PDF descoberto no hub. Passe --url com PDF oficial ou verifique o hub."
        )
    for d in found:
        title = d.title_hint or d.doc_type
        await ingest_pdf_url(
            dsn_pg,
            game_slug=args.game,
            doc_type=d.doc_type,
            title=title,
            url=d.url,
            openai_api_key=key,
        )


if __name__ == "__main__":
    asyncio.run(_main())
