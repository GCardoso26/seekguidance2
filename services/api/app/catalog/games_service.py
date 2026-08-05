"""Serviço de jogos do catálogo (catalog_games + card_sets)."""

from __future__ import annotations

from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.search_service import search_catalog_cards

logger = structlog.get_logger(__name__)

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
    "gundam": "GUNDAM",
    "gundam-card-game": "GUNDAM",
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
    "GUNDAM": "gundam",
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
    sealed_game_clause = ""
    if code:
        params["g"] = code
        game_clause_registry = "WHERE cs.game_code = :g"
        game_clause_catalog = "AND cc.game_code = :g"
        if code == "YGO":
            sealed_game_clause = "AND upper(p.game) IN ('YGO', 'YUGIOH')"
        elif code == "ONEPIECE":
            sealed_game_clause = "AND upper(p.game) IN ('ONEPIECE', 'ONE_PIECE')"
        else:
            sealed_game_clause = "AND upper(p.game) = :g"

    try:
        rows = await _execute_merged_sets_with_covers(
            session,
            params=params,
            game_clause_registry=game_clause_registry,
            game_clause_catalog=game_clause_catalog,
            sealed_game_clause=sealed_game_clause,
        )
    except Exception as exc:
        # Packshot CTE can fail (schema drift / PG timeout) — never block portal expansions.
        logger.warning("catalog_sets_cover_query_failed", error=str(exc), game=code)
        rows = await _execute_merged_sets_basic(
            session,
            params=params,
            game_clause_registry=game_clause_registry,
            game_clause_catalog=game_clause_catalog,
        )

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


async def _execute_merged_sets_basic(
    session: AsyncSession,
    *,
    params: dict[str, Any],
    game_clause_registry: str,
    game_clause_catalog: str,
) -> list[Any]:
    result = await session.execute(
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
            )
            SELECT
              COALESCE(r.code, c.code) AS code,
              COALESCE(r.name, c.name, c.code) AS name,
              COALESCE(c.card_count, r.registry_count, 0) AS card_count,
              r.release_date,
              r.icon_url,
              NULL::text AS cover_url,
              COALESCE(r.game_code, c.game_code) AS game_code
            FROM registry r
            FULL OUTER JOIN catalog_agg c
              ON r.game_code = c.game_code
             AND LOWER(r.code) = LOWER(c.code)
            ORDER BY r.release_date DESC NULLS LAST, name ASC
            LIMIT :limit
            """
        ),
        params,
    )
    return list(result.mappings().all())


async def _execute_merged_sets_with_covers(
    session: AsyncSession,
    *,
    params: dict[str, Any],
    game_clause_registry: str,
    game_clause_catalog: str,
    sealed_game_clause: str,
) -> list[Any]:
    result = await session.execute(
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
                  -- ADR-016: capa = packshot BOX/BUNDLE/ETB/TROVE (todos os jogos), nunca arte de carta.
                  -- 1) SKU PREFIX-BOX|BUNDLE|ETB|TROVE-SET  2) nome da coleção  3) título com nome do set
                  SELECT DISTINCT ON (u.game_code, LOWER(u.code))
                    u.game_code,
                    u.code,
                    u.cdn_url AS cover_url
                  FROM (
                    WITH set_names AS (
                      SELECT game_code, code, name FROM registry WHERE name IS NOT NULL AND name <> ''
                      UNION
                      SELECT game_code, code, name FROM catalog_agg WHERE name IS NOT NULL AND name <> ''
                    ),
                    sealed_assets AS (
                      SELECT
                        CASE upper(p.game)
                          WHEN 'ONE_PIECE' THEN 'ONEPIECE'
                          WHEN 'YUGIOH' THEN 'YGO'
                          ELSE upper(p.game)
                        END AS game_code,
                        COALESCE(NULLIF(p.sku, ''), NULLIF(v.sku, ''), '') AS sku,
                        p.subcategory,
                        COALESCE(p.title_pt, '') AS title_pt,
                        COALESCE(col.name, '') AS collection_name,
                        a.cdn_url,
                        CASE p.subcategory
                          WHEN 'BOOSTER_BOX' THEN 1
                          WHEN 'BUNDLE' THEN 2
                          WHEN 'TROVE' THEN 3
                          WHEN 'ILLUMINEERS_TROVE' THEN 3
                          WHEN 'ELITE_TRAINER_BOX' THEN 4
                          ELSE 9
                        END AS kind_rank,
                        CASE
                          WHEN lower(COALESCE(p.title_pt, ''))
                            ~ '(case|showcase|surge foil|master case|draft night|scene box|armory deck|deck display|tin display|file cards)'
                          THEN 1
                          ELSE 0
                        END AS junk_rank,
                        CASE l.role WHEN 'primary' THEN 0 ELSE 1 END AS role_rank
                      FROM product_catalog.products p
                      JOIN product_catalog.variants v ON v.product_id = p.id
                      JOIN media.asset_links l
                        ON l.entity_type = 'product_variant' AND l.entity_id = v.id
                      JOIN media.assets a ON a.id = l.asset_id
                      LEFT JOIN product_catalog.collections col ON col.id = p.collection_id
                      WHERE p.category = 'SEALED_PRODUCT'
                        AND p.subcategory IN (
                          'BOOSTER_BOX',
                          'BUNDLE',
                          'TROVE',
                          'ILLUMINEERS_TROVE',
                          'ELITE_TRAINER_BOX'
                        )
                        AND a.cdn_url ILIKE 'https://%'
                        AND a.cdn_url NOT ILIKE '%.svg%'
                        AND a.cdn_url NOT ILIKE '%/logo%'
                        AND a.cdn_url NOT ILIKE '%/symbol%'
                        AND a.cdn_url NOT ILIKE '%svgs.scryfall%'
                        AND a.cdn_url NOT ILIKE '%.example%'
                        {sealed_game_clause}
                    )
                    SELECT
                      sa.game_code,
                      (
                        regexp_match(
                          upper(sa.sku),
                          '^[A-Z0-9]+-(?:BOX|BUNDLE|ETB|TROVE)-([A-Z0-9-]+)$'
                        )
                      )[1] AS code,
                      sa.cdn_url,
                      0 AS strategy,
                      sa.kind_rank,
                      sa.junk_rank,
                      sa.role_rank
                    FROM sealed_assets sa
                    WHERE upper(sa.sku) ~ '^[A-Z0-9]+-(?:BOX|BUNDLE|ETB|TROVE)-[A-Z0-9-]+$'
                      -- Evita TCGCSV …-BOOSTER-BOX-G… (não é PREFIX-BOX-SET)
                      AND upper(sa.sku) !~ '-BOOSTER-BOX-'
                      AND upper(sa.sku) !~ '-ELITE-TRAINER-BOX-'

                    UNION ALL

                    SELECT
                      sa.game_code,
                      sn.code,
                      sa.cdn_url,
                      1 AS strategy,
                      sa.kind_rank,
                      sa.junk_rank,
                      sa.role_rank
                    FROM sealed_assets sa
                    JOIN set_names sn
                      ON sn.game_code = sa.game_code
                     AND length(trim(sa.collection_name)) >= 4
                     AND (
                       lower(trim(sa.collection_name)) = lower(trim(sn.name))
                       OR (
                         length(trim(sa.collection_name)) >= 8
                         AND lower(sn.name) LIKE ('%' || lower(trim(sa.collection_name)) || '%')
                       )
                       OR (
                         length(trim(sn.name)) >= 8
                         AND lower(trim(sa.collection_name)) LIKE ('%' || lower(trim(sn.name)) || '%')
                       )
                     )

                    UNION ALL

                    SELECT
                      sa.game_code,
                      sn.code,
                      sa.cdn_url,
                      2 AS strategy,
                      sa.kind_rank,
                      sa.junk_rank,
                      sa.role_rank
                    FROM sealed_assets sa
                    JOIN set_names sn
                      ON sn.game_code = sa.game_code
                     AND length(trim(sn.name)) >= 6
                     AND (
                       lower(sa.title_pt) LIKE ('%' || lower(trim(sn.name)) || '%')
                       OR (
                         -- "Timeless Bonds" ⊂ "BT-26: BOOSTER TIMELESS BONDS"
                         length(trim(sa.collection_name)) >= 8
                         AND lower(sn.name) LIKE ('%' || lower(trim(sa.collection_name)) || '%')
                       )
                     )
                     AND (
                       lower(sa.title_pt) LIKE '%booster box%'
                       OR lower(sa.title_pt) LIKE '%booster display%'
                       OR lower(sa.title_pt) LIKE '%elite trainer%'
                       OR sa.subcategory IN ('BOOSTER_BOX', 'ELITE_TRAINER_BOX', 'BUNDLE')
                     )
                    WHERE sa.junk_rank = 0
                  ) u
                  WHERE u.code IS NOT NULL AND u.code <> ''
                  ORDER BY
                    u.game_code,
                    LOWER(u.code),
                    u.strategy,
                    u.junk_rank,
                    u.kind_rank,
                    u.role_rank
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
    return list(result.mappings().all())


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
