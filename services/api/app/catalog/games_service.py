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
    "dragonball": "DBFW",
    "dragon_ball": "DBFW",
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


def _resolve_game_code(game: str | None) -> str | None:
    if not game:
        return None
    return game_code_from_slug(game) or game.strip().upper()


async def list_merged_catalog_sets(
    session: AsyncSession,
    *,
    game: str | None = None,
    limit: int = 500,
) -> list[dict[str, Any]]:
    """Lista expansões mesclando card_sets (metadados) com agregados de card_catalog."""
    code = _resolve_game_code(game)
    params: dict[str, Any] = {"limit": max(1, min(limit, 1000))}
    game_clause_registry = ""
    game_clause_catalog = ""
    if code:
        params["g"] = code
        game_clause_registry = "WHERE cs.game_code = :g"
        game_clause_catalog = "AND cc.game_code = :g"

    rows = (
        await session.execute(
            text(
                f"""
                WITH catalog_agg AS (
                  SELECT
                    cc.game_code,
                    cc.set_code AS code,
                    MAX(cc.set_name) AS name,
                    COUNT(*)::INTEGER AS card_count
                  FROM tcg_judge.card_catalog cc
                  WHERE cc.set_code IS NOT NULL AND cc.set_code <> ''
                  {game_clause_catalog}
                  GROUP BY cc.game_code, cc.set_code
                ),
                registry AS (
                  SELECT
                    cs.game_code,
                    cs.code,
                    cs.name,
                    cs.release_date,
                    cs.card_count AS registry_count,
                    cs.icon_url
                  FROM tcg_judge.card_sets cs
                  {game_clause_registry}
                ),
                covers AS (
                  SELECT DISTINCT ON (cc.game_code, LOWER(cc.set_code))
                    cc.game_code,
                    cc.set_code AS code,
                    COALESCE(
                      NULLIF(cc.image_url, ''),
                      NULLIF(cc.image_uris->>'normal', ''),
                      NULLIF(cc.image_uris->>'large', ''),
                      NULLIF(cc.image_uris->>'small', '')
                    ) AS cover_url
                  FROM tcg_judge.card_catalog cc
                  WHERE cc.set_code IS NOT NULL AND cc.set_code <> ''
                    AND (
                      NULLIF(cc.image_url, '') IS NOT NULL
                      OR NULLIF(cc.image_uris->>'normal', '') IS NOT NULL
                      OR NULLIF(cc.image_uris->>'large', '') IS NOT NULL
                      OR NULLIF(cc.image_uris->>'small', '') IS NOT NULL
                    )
                    {game_clause_catalog}
                  ORDER BY cc.game_code, LOWER(cc.set_code), cc.name ASC
                )
                SELECT
                  COALESCE(r.code, c.code) AS code,
                  COALESCE(r.name, c.name, c.code) AS name,
                  COALESCE(c.card_count, r.registry_count, 0) AS card_count,
                  r.release_date,
                  r.icon_url,
                  cov.cover_url,
                  COALESCE(r.game_code, c.game_code) AS game_code
                FROM registry r
                FULL OUTER JOIN catalog_agg c
                  ON r.game_code = c.game_code
                 AND LOWER(r.code) = LOWER(c.code)
                LEFT JOIN covers cov
                  ON cov.game_code = COALESCE(r.game_code, c.game_code)
                 AND LOWER(cov.code) = LOWER(COALESCE(r.code, c.code))
                ORDER BY r.release_date DESC NULLS LAST, name ASC
                LIMIT :limit
                """
            ),
            params,
        )
    ).mappings().all()

    return [
        {
            "code": str(r["code"]),
            "name": str(r["name"] or r["code"]),
            "cardCount": int(r["card_count"] or 0),
            "card_count": int(r["card_count"] or 0),
            "release_date": str(r["release_date"]) if r.get("release_date") else None,
            "icon_url": r.get("icon_url"),
            "cover_url": r.get("cover_url"),
            "game_code": r.get("game_code"),
        }
        for r in rows
        if r.get("code")
    ]


async def list_game_sets(session: AsyncSession, slug: str) -> list[dict[str, Any]]:
    code = game_code_from_slug(slug)
    if not code:
        return []

    merged = await list_merged_catalog_sets(session, game=code)
    return [
        {
            "code": s["code"],
            "name": s["name"],
            "release_date": s.get("release_date"),
            "card_count": s.get("card_count"),
            "icon_url": s.get("icon_url"),
            "cover_url": s.get("cover_url"),
        }
        for s in merged
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
