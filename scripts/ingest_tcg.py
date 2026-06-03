#!/usr/bin/env python3
"""CLI: ingestão de PDFs oficiais por TCG (pokemon, lorcana, yugioh, onepiece, mtg)."""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

import structlog

from tcg_judge_ingestion.crawler.mtg_wizards import discover_mtg_official_pdfs
from tcg_judge_ingestion.crawler.tcg_official_sources import list_official_pdfs, resolve_ingest_game_slug
from tcg_judge_ingestion.pipeline.tcg_ingest import ingest_official, ingest_pdf_file, ingest_pdf_url

SUPPORTED = (
    "mtg",
    "pokemon",
    "lorcana",
    "yugioh",
    "onepiece",
    "fab",
    "flesh_and_blood",
    "digimon",
    "gundam",
    "dbfw",
    "dragon_ball",
    "sorcery",
    "vanguard",
    "riftbound",
    "union_arena",
)


def _to_asyncpg_dsn(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://")


def _load_dotenv_files() -> None:
    """Carrega .env — nunca sobrescreve variáveis já definidas no shell antes do script."""
    repo = Path(__file__).resolve().parents[1]
    shell_keys = frozenset(os.environ.keys())
    candidates = (
        repo / "services" / "api" / ".env",
        repo / ".env",
        repo / ".env.local",
        repo / ".env.production",
    )
    for path in candidates:
        if not path.is_file():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in shell_keys:
                os.environ[key] = value


async def _ingest_catalog(
    game: str, dsn: str, key: str, only: str | None, *, ingest_root: str
) -> None:
    pdfs = list_official_pdfs(game)
    if only:
        pdfs = [p for p in pdfs if p.doc_type == only]
    if not pdfs:
        raise SystemExit(f"Nenhum PDF no catálogo para game={game} only={only}")
    failed = 0
    for p in pdfs:
        print(f"==> {p.doc_type}: {p.title}")
        try:
            doc_id = await ingest_official(
                dsn,
                game_slug=game,
                source=p,
                openai_api_key=key,
                ingest_root=ingest_root,
            )
            print(f"    OK document_id={doc_id}")
        except Exception as exc:
            failed += 1
            print(f"    AVISO: falhou ({exc})")
    if failed == len(pdfs):
        raise SystemExit(f"Todos os {failed} documento(s) falharam para game={game}")
    if failed:
        print(f"AVISO: {failed}/{len(pdfs)} documento(s) falharam para game={game}")


async def _main() -> None:
    _load_dotenv_files()
    structlog.configure(processors=[structlog.processors.JSONRenderer()])
    p = argparse.ArgumentParser(description="Ingestão oficial de regras TCG (PDF → RDS)")
    p.add_argument("--game", required=True, choices=SUPPORTED)
    p.add_argument("--all", action="store_true", help="Ingerir todos os PDFs do catálogo")
    p.add_argument("--only", help="Filtrar doc_type (CR, MTR, FORMAT_STANDARD, …)")
    p.add_argument("--url", help="PDF directo (ignora catálogo)")
    p.add_argument("--file", help="PDF local (ignora download; usa com --doc-type e --title)")
    p.add_argument("--ingest-root", default="data/ingest", help="Raiz para PDFs locais (data/ingest/<game>/)")
    p.add_argument("--doc-type", default="CR")
    p.add_argument("--title", default="")
    p.add_argument("--publisher", default="")
    p.add_argument("--mtg-discover", action="store_true", help="MTG: descobrir no hub Wizards")
    p.add_argument("--mtg-only", choices=("CR", "MTR", "IPG", "RELEASE", "ALL"), default="ALL")
    args = p.parse_args()

    dsn = os.environ.get("DATABASE_URL", "")
    key = os.environ.get("OPENAI_API_KEY", "")
    if not dsn:
        raise SystemExit(
            "DATABASE_URL obrigatório.\n"
            "  PowerShell: $env:DATABASE_URL = 'postgresql+asyncpg://...'\n"
            "  Ou crie S:\\tcg-judge\\.env.production (copie de .env.supabase.example)\n"
            "  Ou defina em services\\api\\.env (o script carrega automaticamente).\n"
            "  Senha com # na URL: use %23 (ex.: MyPass%23word) ou deixe o script reparar."
        )
    if not key:
        raise SystemExit(
            "OPENAI_API_KEY obrigatório para embeddings.\n"
            "  PowerShell: $env:OPENAI_API_KEY = 'sk-...'"
        )

    dsn_pg = _to_asyncpg_dsn(dsn)
    game = resolve_ingest_game_slug(args.game)

    if game == "mtg" and args.mtg_discover:
        found = await discover_mtg_official_pdfs()
        if args.mtg_only != "ALL":
            found = [d for d in found if d.doc_type == args.mtg_only]
        for d in found:
            await ingest_pdf_url(
                dsn_pg,
                game_slug="mtg",
                doc_type=d.doc_type,
                title=d.title_hint or d.doc_type,
                url=d.url,
                openai_api_key=key,
                publisher="Wizards of the Coast",
                ingestion_tag="mtg_wizards",
            )
        return

    if args.file:
        title = args.title or args.doc_type
        publisher = args.publisher or "The Pokémon Company International"
        doc_id = await ingest_pdf_file(
            dsn_pg,
            path=args.file,
            game_slug=game,
            doc_type=args.doc_type,
            title=title,
            openai_api_key=key,
            publisher=publisher,
        )
        print(f"OK document_id={doc_id}")
        return

    if args.url:
        title = args.title or args.doc_type
        publisher = args.publisher or "Official Publisher"
        await ingest_pdf_url(
            dsn_pg,
            game_slug=game,
            doc_type=args.doc_type,
            title=title,
            url=args.url,
            openai_api_key=key,
            publisher=publisher,
        )
        return

    if args.all or args.only:
        await _ingest_catalog(game, dsn_pg, key, args.only, ingest_root=args.ingest_root)
        return

    p.print_help()
    raise SystemExit("Use --all ou --url ou (mtg) --mtg-discover")


if __name__ == "__main__":
    try:
        asyncio.run(_main())
    except KeyboardInterrupt:
        sys.exit(130)
