"""Serviço de jogos do catálogo (catalog_games + card_sets)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.search_service import search_catalog_cards

SLUG_TO_CODE: dict[str, str] = {
    "mtg": "MTG",
    "magic": "MTG",
    "pokemon": "POKEMON",
    "yugioh": "YGO",
    "ygo": "YGO",
    "lorcana": "LORCANA",
    "onepiece": "ONEPIECE",
    "fab": "FAB",
    "digimon": "DIGIMON",
    "swu": "SWU",
    "riftbound": "RIFTBOUND",
    "sorcery": "SORCERY",
    "unionarena": "UARENA",
    "union-arena": "UARENA",
    "dbfw": "DBFW",
    "db-fusion-world": "DBFW",
    "vanguard": "VANGUARD",
    "cardfight-vanguard": "VANGUARD",
}

CODE_TO_SLUG: dict[str, str] = {
    "MTG": "mtg",
    "POKEMON": "pokemon",
    "YGO": "yugioh",
    "LORCANA": "lorcana",
    "ONEPIECE": "onepiece",
    "FAB": "fab",
    "DIGIMON": "digimon",
    "SWU": "swu",
    "RIFTBOUND": "riftbound",
    "SORCERY": "sorcery",
    "UARENA": "union-arena",
    "DBFW": "dbfw",
    "VANGUARD": "vanguard",
}


def game_code_from_slug(slug: str) -> str | None:
    normalized = slug.lower().strip().replace("-", "")
    for key, code in SLUG_TO_CODE.items():
        if key.replace("-", "") == normalized:
            return code
    return SLUG_TO_CODE.get(slug.lower())


def _row_to_game(row: dict[str, Any]) -> dict[str, Any]:
    code = str(row["game_code"])
    return {
        "id": str(row["id"]),
        "game_code": code,
        "slug": row["slug"],
        "name": row["display_name"],
        "display_name": row["display_name"],
        "description": row.get("description"),
        "logo_url": row.get("logo_url"),
        "banner_url": row.get("banner_url"),
        "is_active": bool(row.get("is_active")),
        "api_source": row.get("api_source"),
        "card_count": int(row.get("card_count") or 0),
        "last_sync_at": row["last_sync_at"].isoformat() if row.get("last_sync_at") else None,
        "sort_order": int(row.get("sort_order") or 0),
    }


async def list_catalog_games(session: AsyncSession, *, active_only: bool = True) -> list[dict[str, Any]]:
    try:
        clause = "WHERE is_active = TRUE" if active_only else ""
        rows = (
            await session.execute(
                text(
                    f"""
                    SELECT id, game_code, slug, display_name, description, logo_url, banner_url,
                           is_active, api_source, card_count, last_sync_at, sort_order
                    FROM tcg_judge.catalog_games
                    {clause}
                    ORDER BY sort_order ASC, display_name ASC
                    """
                )
            )
        ).mappings().all()
        if rows:
            return [_row_to_game(dict(r)) for r in rows]
    except Exception:
        pass

    # Fallback antes da migration ou se tabela vazia
    counts = (
        await session.execute(
            text(
                """
                SELECT game_code, COUNT(*)::INTEGER AS cnt, MAX(last_synced_at) AS last_sync
                FROM tcg_judge.card_catalog
                GROUP BY game_code
                """
            )
        )
    ).mappings().all()
    count_map = {r["game_code"]: int(r["cnt"]) for r in counts}
    static = [
        ("MTG", "mtg", "Magic: The Gathering", "scryfall", 1),
        ("POKEMON", "pokemon", "Pokémon TCG", "tcgdex", 2),
        ("YGO", "yugioh", "Yu-Gi-Oh!", "ygoprodeck", 3),
        ("LORCANA", "lorcana", "Disney Lorcana", "lorcast", 4),
        ("ONEPIECE", "onepiece", "One Piece TCG", "optcgapi", 5),
        ("FAB", "fab", "Flesh and Blood", "goagain", 6),
        ("DIGIMON", "digimon", "Digimon TCG", "digimoncard", 7),
    ]
    return [
        {
            "id": slug,
            "game_code": code,
            "slug": slug,
            "name": name,
            "display_name": name,
            "description": None,
            "logo_url": f"/logos/{slug}.svg",
            "banner_url": None,
            "is_active": True,
            "api_source": source,
            "card_count": count_map.get(code, 0),
            "last_sync_at": None,
            "sort_order": order,
        }
        for code, slug, name, source, order in static
    ]


async def get_catalog_game(session: AsyncSession, slug: str) -> dict[str, Any] | None:
    code = game_code_from_slug(slug)
    if not code:
        return None
    row = (
        await session.execute(
            text(
                """
                SELECT id, game_code, slug, display_name, description, logo_url, banner_url,
                       is_active, api_source, card_count, last_sync_at, sort_order
                FROM tcg_judge.catalog_games
                WHERE game_code = :code OR slug = :slug
                LIMIT 1
                """
            ),
            {"code": code, "slug": slug.lower()},
        )
    ).mappings().first()
    if not row:
        return None
    return _row_to_game(dict(row))


async def list_game_sets(session: AsyncSession, slug: str) -> list[dict[str, Any]]:
    code = game_code_from_slug(slug)
    if not code:
        return []

    rows = (
        await session.execute(
            text(
                """
                SELECT code, name, release_date, card_count, icon_url, external_id
                FROM tcg_judge.card_sets
                WHERE game_code = :g
                ORDER BY release_date DESC NULLS LAST, name ASC
                """
            ),
            {"g": code},
        )
    ).mappings().all()

    if rows:
        return [
            {
                "code": r["code"],
                "name": r["name"],
                "release_date": str(r["release_date"]) if r.get("release_date") else None,
                "card_count": int(r["card_count"]) if r.get("card_count") is not None else None,
                "icon_url": r.get("icon_url"),
            }
            for r in rows
        ]

    # Fallback: agregar de card_catalog
    agg = (
        await session.execute(
            text(
                """
                SELECT set_code AS code, set_name AS name, COUNT(*)::INTEGER AS card_count
                FROM tcg_judge.card_catalog
                WHERE game_code = :g AND set_code IS NOT NULL
                GROUP BY set_code, set_name
                ORDER BY set_name ASC
                """
            ),
            {"g": code},
        )
    ).mappings().all()
    return [
        {"code": r["code"], "name": r["name"] or r["code"], "card_count": int(r["card_count"])}
        for r in agg
    ]


async def search_game_cards(
    session: AsyncSession,
    slug: str,
    **kwargs: Any,
) -> dict[str, Any]:
    code = game_code_from_slug(slug)
    if not code:
        return {"cards": [], "total": 0, "page": 1, "totalPages": 0, "hasMore": False}
    return await search_catalog_cards(session, game=code, **kwargs)


async def refresh_catalog_game_counts(session: AsyncSession) -> None:
    try:
        await session.execute(text("SELECT tcg_judge.refresh_catalog_game_counts()"))
        await session.commit()
    except Exception:
        await session.rollback()
