"""Pipeline de ingestão de cartas — orquestra adapters + indexação."""

from __future__ import annotations

from typing import Any, Callable, Awaitable

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.health import verify_ingestion
from app.catalog.search_index import index_cards, meili_enabled
from app.catalog.validate import validate_card_payload
from app.tcg_adapters.sync_lorcana import sync_lorcana
from app.tcg_adapters.sync_mtg import sync_scryfall
from app.tcg_adapters.sync_pokemon import sync_tcgdex
from app.tcg_adapters.sync_yugioh import sync_yugioh

logger = structlog.get_logger(__name__)

SyncFn = Callable[[AsyncSession], Awaitable[dict[str, Any]]]

SYNC_SOURCES: dict[str, tuple[str, SyncFn]] = {
    "MTG": ("scryfall", sync_scryfall),
    "POKEMON": ("tcgdex", sync_tcgdex),
    "LORCANA": ("lorcanajson", sync_lorcana),
    "YGO": ("ygoprodeck", sync_yugioh),
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


async def _cards_for_index(session: AsyncSession, game_code: str, limit: int = 5000) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT id, game_code, name, normalized_name, set_code, set_name,
                       card_number, rarity, card_type, image_url, image_uris,
                       game_data, language
                FROM tcg_judge.card_catalog
                WHERE game_code = :g
                ORDER BY last_synced_at DESC NULLS LAST
                LIMIT :lim
                """
            ),
            {"g": game_code, "lim": limit},
        )
    ).mappings().all()
    docs: list[dict[str, Any]] = []
    for row in rows:
        game_data = row.get("game_data") or {}
        text_bits = [
            str(game_data.get("oracle_text") or ""),
            str(game_data.get("type_line") or row.get("card_type") or ""),
        ]
        docs.append(
            {
                "id": str(row["id"]),
                "name": row["name"],
                "nameNormalized": row["normalized_name"],
                "game": row["game_code"],
                "set": row.get("set_name"),
                "setCode": row.get("set_code"),
                "number": row.get("card_number"),
                "rarity": row.get("rarity"),
                "type": row.get("card_type"),
                "imageUrl": row.get("image_url") or (row.get("image_uris") or {}).get("normal"),
                "language": row.get("language") or "en",
                "text": " ".join(t for t in text_bits if t).strip(),
            }
        )
    return docs


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
        if code == "MTG":
            result = await sync_fn(session, limit=None if full else 500)
        elif code == "POKEMON":
            result = await sync_fn(session, max_sets=None if full else 3)
        else:
            result = await sync_fn(session)

        synced = int(result.get("synced") or 0)
        await _log_sync_run(session, game_code=code, source=source, status="ok", cards_synced=synced)
        await session.commit()

        index_result: dict[str, Any] = {"status": "skipped"}
        if index_search and meili_enabled():
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
        await session.commit()
        logger.exception("catalog_sync_failed", game=code)
        return {"status": "error", "game": code, "message": str(exc)}


async def run_full_ingestion(session: AsyncSession, *, full: bool = False) -> dict[str, Any]:
    results: dict[str, Any] = {}
    for game_code in SYNC_SOURCES:
        results[game_code] = await run_game_sync(session, game_code, full=full)
    results["health"] = await verify_ingestion(session)
    return results


def validate_before_upsert(card: dict[str, Any]) -> dict[str, Any]:
    result = validate_card_payload(card)
    if not result.is_valid:
        raise ValueError("; ".join(result.errors))
    return card
