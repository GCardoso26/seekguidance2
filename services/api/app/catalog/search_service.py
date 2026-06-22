"""Busca facetada de cartas no catálogo (PostgreSQL + Meilisearch opcional)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.search_index import meili_enabled, search_meili

SORT_WHITELIST = frozenset(
    {"relevance", "price_asc", "price_desc", "name_asc", "name_desc", "newest"}
)


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def _card_payload(row: dict[str, Any]) -> dict[str, Any]:
    image_uris = row.get("image_uris") or {}
    if isinstance(image_uris, str):
        image_uris = {}
    normal = image_uris.get("normal") or row.get("image_url")
    small = image_uris.get("small") or normal
    large = image_uris.get("large") or normal

    latest_cents = row.get("latest_price_cents")
    lowest_cents = row.get("lowest_price_cents")
    week_ago_cents = row.get("week_ago_price_cents")

    trend_7d: float | None = None
    if latest_cents is not None and week_ago_cents and int(week_ago_cents) > 0:
        trend_7d = round(
            ((int(latest_cents) - int(week_ago_cents)) / int(week_ago_cents)) * 100,
            2,
        )

    latest_price = None
    if latest_cents is not None:
        latest_price = {
            "price": round(int(latest_cents) / 100, 2),
            "currency": row.get("latest_currency") or "USD",
            "condition": row.get("latest_condition") or "NM",
            "foil": bool(row.get("latest_foil")),
            "source": row.get("latest_source") or "market",
        }

    return {
        "id": str(row["id"]),
        "name": row["name"],
        "normalizedName": row.get("normalized_name"),
        "game": row["game_code"],
        "set": {
            "name": row.get("set_name") or "",
            "code": row.get("set_code") or "",
        },
        "number": row.get("card_number") or "",
        "rarity": row.get("rarity") or "",
        "language": row.get("language") or "en",
        "imageUris": {
            "small": small or "",
            "normal": normal or "",
            "large": large or normal or "",
        },
        "gameData": row.get("game_data") or {},
        "source": row.get("source") or row["game_code"].lower(),
        "version": int(row.get("version") or 1),
        "isReprint": bool(row.get("is_reprint")),
        "latestPrice": latest_price,
        "priceTrend7d": trend_7d,
        "lowestPrice": round(int(lowest_cents) / 100, 2) if lowest_cents is not None else None,
        "listingCount": int(row.get("listing_count") or 0),
    }


def _build_where(
    *,
    game: str | None,
    set_code: str | None,
    rarities: list[str],
    language: str | None,
    conditions: list[str],
    foil: bool | None,
    price_min_cents: int | None,
    price_max_cents: int | None,
    query: str,
    meili_ids: list[str] | None,
    card_ids: list[str] | None,
) -> tuple[str, dict[str, Any]]:
    clauses = ["1=1"]
    params: dict[str, Any] = {}

    if meili_ids is not None:
        if not meili_ids:
            clauses.append("FALSE")
        else:
            placeholders = ", ".join(f":mid_{i}" for i in range(len(meili_ids)))
            clauses.append(f"cc.id IN ({placeholders})")
            for i, uid in enumerate(meili_ids):
                params[f"mid_{i}"] = uid
    elif query:
        clauses.append("cc.normalized_name ILIKE :pattern")
        params["pattern"] = f"%{query.lower()}%"

    if card_ids:
        placeholders = ", ".join(f":cid_{i}" for i in range(len(card_ids)))
        clauses.append(f"cc.id IN ({placeholders})")
        for i, cid in enumerate(card_ids):
            params[f"cid_{i}"] = cid

    if game:
        clauses.append("cc.game_code = :game")
        params["game"] = game.upper()

    if set_code:
        clauses.append("cc.set_code = :set_code")
        params["set_code"] = set_code.upper()

    if rarities:
        clauses.append("LOWER(cc.rarity) = ANY(:rarities)")
        params["rarities"] = [r.lower() for r in rarities]

    if language:
        clauses.append("cc.language = :language")
        params["language"] = language.lower()

    if conditions:
        clauses.append(
            """
            EXISTS (
              SELECT 1 FROM tcg_judge.card_prices cpf
              WHERE cpf.card_id = cc.id AND cpf.condition = ANY(:conditions)
            )
            """
        )
        params["conditions"] = conditions

    if foil is not None:
        clauses.append(
            """
            EXISTS (
              SELECT 1 FROM tcg_judge.card_prices cpf
              WHERE cpf.card_id = cc.id AND cpf.foil = :foil
            )
            """
        )
        params["foil"] = foil

    if price_min_cents is not None:
        clauses.append("COALESCE(minp.min_cents, latest.price_cents) >= :price_min")
        params["price_min"] = price_min_cents

    if price_max_cents is not None:
        clauses.append("COALESCE(minp.min_cents, latest.price_cents) <= :price_max")
        params["price_max"] = price_max_cents

    return " AND ".join(clauses), params


def _order_by(sort: str) -> str:
    if sort == "price_asc":
        return "COALESCE(minp.min_cents, latest.price_cents) ASC NULLS LAST, cc.name ASC"
    if sort == "price_desc":
        return "COALESCE(minp.min_cents, latest.price_cents) DESC NULLS LAST, cc.name ASC"
    if sort == "name_desc":
        return "cc.name DESC"
    if sort == "newest":
        return "cc.last_synced_at DESC NULLS LAST, cc.name ASC"
    return "cc.name ASC"


async def search_catalog_cards(
    session: AsyncSession,
    *,
    q: str = "",
    game: str | None = None,
    set_code: str | None = None,
    rarity: str | None = None,
    condition: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    language: str | None = None,
    foil: bool | None = None,
    sort: str = "relevance",
    card_ids: list[str] | None = None,
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    sort_key = sort if sort in SORT_WHITELIST else "relevance"
    query = q.strip()
    game_code = game.upper() if game else None
    offset = (page - 1) * limit
    week_ago = datetime.now(UTC) - timedelta(days=7)

    meili_ids: list[str] | None = None
    if meili_enabled() and query:
        hits = await search_meili(query, game=game_code, limit=limit * 3)
        meili_ids = [str(h.get("id")) for h in hits if h.get("id")]

    rarities = _split_csv(rarity)
    conditions = _split_csv(condition)
    price_min_cents = int(price_min * 100) if price_min is not None else None
    price_max_cents = int(price_max * 100) if price_max is not None else None

    where_sql, params = _build_where(
        game=game_code,
        set_code=set_code,
        rarities=rarities,
        language=language,
        conditions=conditions,
        foil=foil,
        price_min_cents=price_min_cents,
        price_max_cents=price_max_cents,
        query=query if meili_ids is None else "",
        meili_ids=meili_ids,
        card_ids=card_ids,
    )

    base_from = f"""
        FROM tcg_judge.card_catalog cc
        LEFT JOIN LATERAL (
          SELECT cp.price_cents, cp.currency, cp.condition, cp.foil, cp.source, cp.recorded_at
          FROM tcg_judge.card_prices cp
          WHERE cp.card_id = cc.id
          ORDER BY cp.recorded_at DESC
          LIMIT 1
        ) latest ON TRUE
        LEFT JOIN LATERAL (
          SELECT MIN(cp2.price_cents) AS min_cents
          FROM tcg_judge.card_prices cp2
          WHERE cp2.card_id = cc.id
        ) minp ON TRUE
        LEFT JOIN LATERAL (
          SELECT cp3.price_cents AS week_ago_cents
          FROM tcg_judge.card_prices cp3
          WHERE cp3.card_id = cc.id AND cp3.recorded_at <= :week_ago
          ORDER BY cp3.recorded_at DESC
          LIMIT 1
        ) week_ago ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS cnt
          FROM tcg_judge.card_prices cp4
          WHERE cp4.card_id = cc.id
        ) listings ON TRUE
        WHERE {where_sql}
    """

    params = {**params, "week_ago": week_ago, "lim": limit, "off": offset}

    select_sql = f"""
        SELECT cc.id, cc.game_code, cc.external_id, cc.name, cc.normalized_name,
               cc.set_code, cc.set_name, cc.card_number, cc.rarity, cc.image_url,
               cc.image_uris, cc.game_data, cc.language, cc.source, cc.version,
               cc.is_reprint, cc.last_synced_at,
               latest.price_cents AS latest_price_cents,
               latest.currency AS latest_currency,
               latest.condition AS latest_condition,
               latest.foil AS latest_foil,
               latest.source AS latest_source,
               minp.min_cents AS lowest_price_cents,
               week_ago.week_ago_cents AS week_ago_price_cents,
               listings.cnt AS listing_count
        {base_from}
        ORDER BY {_order_by(sort_key)}
        LIMIT :lim OFFSET :off
    """

    count_sql = f"SELECT COUNT(*) AS total {base_from}"

    rows = (await session.execute(text(select_sql), params)).mappings().all()
    total_row = (await session.execute(text(count_sql), params)).mappings().first()
    total = int(total_row["total"]) if total_row else 0

    cards = [_card_payload(dict(row)) for row in rows]
    total_pages = max(1, (total + limit - 1) // limit) if total else 0

    return {
        "source": "meilisearch" if meili_ids is not None else "postgres",
        "cards": cards,
        "total": total,
        "page": page,
        "totalPages": total_pages,
        "hasMore": page * limit < total,
    }


async def list_catalog_sets(session: AsyncSession, *, game: str | None = None) -> list[dict[str, str]]:
    sql = """
        SELECT set_code AS code, MAX(set_name) AS name, COUNT(*) AS card_count
        FROM tcg_judge.card_catalog
        WHERE set_code IS NOT NULL AND set_code <> ''
    """
    params: dict[str, Any] = {}
    if game:
        sql += " AND game_code = :game"
        params["game"] = game.upper()
    sql += " GROUP BY set_code ORDER BY name LIMIT 500"

    rows = (await session.execute(text(sql), params)).mappings().all()
    return [
        {"code": str(r["code"]), "name": str(r["name"] or r["code"]), "cardCount": str(r["card_count"])}
        for r in rows
    ]
