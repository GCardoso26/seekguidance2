"""Pipeline de ingestão de cartas — orquestra adapters + indexação."""

from __future__ import annotations

import os
from collections.abc import Awaitable, Callable
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.games_service import refresh_catalog_game_counts
from app.catalog.health import verify_ingestion
from app.catalog.search_index import index_cards, meili_enabled
from app.catalog.validate import validate_card_payload
from app.tcg_adapters.sync_digimon import sync_digimon
from app.tcg_adapters.sync_fab import sync_fab
from app.tcg_adapters.sync_lorcana import sync_lorcana
from app.tcg_adapters.sync_mtg import sync_scryfall
from app.tcg_adapters.sync_onepiece import sync_onepiece
from app.tcg_adapters.sync_pokemon import sync_tcgdex
from app.tcg_adapters.sync_pokemontcg import sync_pokemontcg
from app.tcg_adapters.sync_yugioh import sync_yugioh

logger = structlog.get_logger(__name__)

SyncFn = Callable[[AsyncSession], Awaitable[dict[str, Any]]]
INDEX_BATCH_LIMIT = int(os.getenv("MEILI_INDEX_BATCH", "10000"))


async def _pokemon_sync(session: AsyncSession) -> dict[str, Any]:
    if os.getenv("POKEMON_TCG_API_KEY"):
        return await sync_pokemontcg(session, max_pages=None)
    return await sync_tcgdex(session, max_sets=None)


SYNC_SOURCES: dict[str, tuple[str, SyncFn]] = {
    "MTG": ("scryfall", sync_scryfall),
    "POKEMON": ("pokemontcg" if os.getenv("POKEMON_TCG_API_KEY") else "tcgdex", _pokemon_sync),
    "LORCANA": ("lorcast", sync_lorcana),
    "YGO": ("ygoprodeck", sync_yugioh),
    "ONEPIECE": ("optcgapi", sync_onepiece),
    "FAB": ("goagain", sync_fab),
    "DIGIMON": ("digimoncard", sync_digimon),
}


async def _log_sync_run(
    session: AsyncSession,
    *,
    game_code: str,
    source: str,
    status: str,
    cards_synced: int = 0,
    error_message: str | None = None,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.card_sync_runs
              (game_code, source, status, cards_synced, error_message, finished_at)
            VALUES (:g, :src, :st, :cnt, :err, NOW())
            """
        ),
        {
            "g": game_code,
            "src": source,
            "st": status,
            "cnt": cards_synced,
            "err": error_message,
        },
    )


async def _cards_for_index(session: AsyncSession, game_code: str, limit: int | None = None) -> list[dict[str, Any]]:
    lim = limit or INDEX_BATCH_LIMIT
    rows = (
        await session.execute(
            text(
                """
                SELECT id, game_code, name, normalized_name, set_code, set_name,
                       card_number, rarity, card_type, image_url, image_uris,
                       game_data, language, legality
                FROM tcg_judge.card_catalog
                WHERE game_code = :g
                ORDER BY last_synced_at DESC NULLS LAST
                LIMIT :lim
                """
            ),
            {"g": game_code, "lim": lim},
        )
    ).mappings().all()
    docs: list[dict[str, Any]] = []
    for row in rows:
        game_data = row.get("game_data") or {}
        if isinstance(game_data, str):
            game_data = {}
        text_bits = [
            str(game_data.get("oracle_text") or ""),
            str(game_data.get("type_line") or row.get("card_type") or ""),
            str(game_data.get("text") or game_data.get("desc") or ""),
        ]
        legality = row.get("legality") or {}
        docs.append(
            {
                "id": str(row["id"]),
                "name": row["name"],
                "nameNormalized": row["normalized_name"],
                "game": row["game_code"],
                "game_slug": row["game_code"].lower(),
                "set": row.get("set_name"),
                "setCode": row.get("set_code"),
                "set_name": row.get("set_name"),
                "number": row.get("card_number"),
                "rarity": row.get("rarity"),
                "type": row.get("card_type"),
                "card_type": row.get("card_type"),
                "imageUrl": row.get("image_url") or (row.get("image_uris") or {}).get("normal"),
                "language": row.get("language") or "en",
                "text": " ".join(t for t in text_bits if t).strip(),
                "legalities": legality if isinstance(legality, dict) else {},
            }
        )
    return docs


async def reindex_game_from_db(session: AsyncSession, game_code: str) -> dict[str, Any]:
    docs = await _cards_for_index(session, game_code.upper(), limit=INDEX_BATCH_LIMIT)
    return await index_cards(docs)


async def run_game_sync(
    session: AsyncSession,
    game_code: str,
    *,
    full: bool = False,
    index_search: bool = True,
) -> dict[str, Any]:
    code = game_code.upper()
    entry = SYNC_SOURCES.get(code)
    if not entry:
        return {"status": "error", "message": f"Jogo não suportado: {game_code}"}

    source, sync_fn = entry
    try:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.catalog_games
                SET sync_status = 'syncing'
                WHERE game_code = :code
                """
            ),
            {"code": code},
        )
        await session.commit()

        if code == "MTG":
            result = await sync_fn(session, limit=None if full else 100)
        elif code == "POKEMON":
            if os.getenv("POKEMON_TCG_API_KEY"):
                result = await sync_pokemontcg(session, max_pages=None if full else 5)
            else:
                result = await sync_tcgdex(session, max_sets=None if full else 3)
        elif code in ("ONEPIECE", "DIGIMON"):
            result = await sync_fn(session, limit=None if full else 500)
        else:
            result = await sync_fn(session)

        synced = int(result.get("synced") or 0)
        await _log_sync_run(session, game_code=code, source=source, status="ok", cards_synced=synced)
        await session.execute(
            text(
                """
                UPDATE tcg_judge.catalog_games
                SET sync_status = 'completed', last_sync_at = NOW()
                WHERE game_code = :code
                """
            ),
            {"code": code},
        )
        await refresh_catalog_game_counts(session)

        index_result: dict[str, Any] = {"status": "skipped"}
        if index_search and meili_enabled():
            if full:
                index_result = await reindex_game_from_db(session, code)
            else:
                docs = await _cards_for_index(session, code)
                index_result = await index_cards(docs)

        return {**result, "index": index_result}
    except Exception as exc:
        await _log_sync_run(
            session,
            game_code=code,
            source=source,
            status="error",
            error_message=str(exc)[:500],
        )
        await session.execute(
            text(
                """
                UPDATE tcg_judge.catalog_games
                SET sync_status = 'failed'
                WHERE game_code = :code
                """
            ),
            {"code": code},
        )
        await session.commit()
        logger.exception("catalog_sync_failed", game=code)
        return {"status": "error", "game": code, "message": str(exc)}


async def run_full_ingestion(session: AsyncSession, *, full: bool = False) -> dict[str, Any]:
    results: dict[str, Any] = {}
    for gc in SYNC_SOURCES:
        results[gc] = await run_game_sync(session, gc, full=full)
    results["health"] = await verify_ingestion(session)
    return results


def validate_before_upsert(card: dict[str, Any]) -> dict[str, Any]:
    result = validate_card_payload(card)
    if not result.is_valid:
        raise ValueError("; ".join(result.errors))
    return card
