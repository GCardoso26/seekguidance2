"""Serviço de vendedores do marketplace (perfil público, listagem, produtos)."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.image_utils import normalize_tcgdex_image_url
from app.marketplace import shop_reviews as shop_reviews_svc
from app.players.store import get_profile_by_handle

_COUNTRY_NAMES = {
    "BR": "Brasil",
    "US": "Estados Unidos",
    "PT": "Portugal",
    "AR": "Argentina",
    "CL": "Chile",
    "MX": "México",
    "ES": "Espanha",
    "FR": "França",
    "DE": "Alemanha",
    "GB": "Reino Unido",
    "CA": "Canadá",
}


def _stable_numeric_id(value: str) -> int:
    return abs(hash(value)) % 900_000_000 + 10_000


def _country_name(code: str | None) -> str | None:
    if not code:
        return None
    return _COUNTRY_NAMES.get(code.upper(), code.upper())


def _serialize_seller(row: dict[str, Any]) -> dict[str, Any]:
    owner_id = str(row["owner_id"])
    handle = str(row.get("handle") or row.get("store_slug") or "")
    plan = str(row.get("subscription_plan") or "free")
    verified = str(row.get("verification_status") or "") == "verified"
    user_type = "professional" if plan in ("pro", "enterprise") or verified else "normal"

    return {
        "id": _stable_numeric_id(owner_id),
        "username": handle,
        "display_name": str(row.get("display_name") or row.get("store_name") or handle),
        "avatar_url": row.get("avatar_url") or row.get("store_logo"),
        "country_code": str(row.get("country") or "BR"),
        "country_name": _country_name(row.get("country")),
        "user_type": user_type,
        "rating": float(row.get("average_rating") or 0),
        "total_reviews": int(row.get("review_count") or 0),
        "total_items": int(row.get("total_items") or 0),
        "unique_items": int(row.get("unique_items") or 0),
        "response_time_hours": None,
        "can_sell_via_hub": bool(row.get("shop_enabled")),
        "on_vacation": False,
        "joined_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "last_active_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


async def _resolve_seller_row(session: AsyncSession, username: str) -> dict[str, Any]:
    ref = username.strip()
    profile = await get_profile_by_handle(session, ref)
    if not profile:
        raise HTTPException(404, "Vendedor não encontrado")

    row = (
        await session.execute(
            text(
                """
                SELECT
                  pp.id AS owner_id,
                  pp.handle,
                  pp.display_name,
                  pp.avatar_url,
                  pp.country,
                  pp.created_at,
                  pp.updated_at,
                  s.id AS store_id,
                  s.name AS store_name,
                  s.slug AS store_slug,
                  s.description AS store_description,
                  s.logo_url AS store_logo,
                  s.average_rating,
                  s.review_count,
                  s.shop_enabled,
                  s.subscription_plan,
                  s.verification_status
                FROM tcg_judge.player_profiles pp
                LEFT JOIN tcg_judge.stores s ON s.owner_id = pp.id
                WHERE pp.id = :pid
                ORDER BY s.shop_enabled DESC NULLS LAST, s.created_at ASC NULLS LAST
                LIMIT 1
                """
            ),
            {"pid": str(profile["id"])},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Vendedor não encontrado")
    return dict(row)


async def _inventory_stats(session: AsyncSession, owner_id: str) -> tuple[int, int]:
    stats = (
        await session.execute(
            text(
                """
                SELECT
                  COALESCE(SUM(cl.quantity), 0)::int AS total_items,
                  COUNT(DISTINCT cl.card_id)::int AS unique_items
                FROM tcg_judge.card_listings cl
                WHERE cl.seller_id = :sid AND cl.status = 'active' AND cl.quantity > 0
                """
            ),
            {"sid": owner_id},
        )
    ).mappings().first()
    if not stats:
        return 0, 0
    return int(stats["total_items"] or 0), int(stats["unique_items"] or 0)


async def list_sellers(
    session: AsyncSession,
    *,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    sort: Literal["rating", "items", "newest", "name"] = "rating",
    country_code: str | None = None,
    user_type: Literal["normal", "professional"] | None = None,
) -> dict[str, Any]:
    page = max(1, page)
    limit = max(1, min(limit, 100))
    offset = (page - 1) * limit

    clauses = [
        "s.shop_enabled = true",
        """EXISTS (
            SELECT 1 FROM tcg_judge.card_listings cl
            WHERE cl.seller_id = pp.id AND cl.status = 'active' AND cl.quantity > 0
        )""",
    ]
    params: dict[str, Any] = {"lim": limit, "off": offset}

    if search:
        clauses.append("(pp.handle ILIKE :q OR pp.display_name ILIKE :q OR s.name ILIKE :q)")
        params["q"] = f"%{search.strip()}%"

    if country_code:
        clauses.append("COALESCE(pp.country, s.country, 'BR') = :cc")
        params["cc"] = country_code.upper()

    if user_type == "professional":
        clauses.append(
            "(s.subscription_plan IN ('pro', 'enterprise') OR s.verification_status = 'verified')"
        )
    elif user_type == "normal":
        clauses.append(
            "s.subscription_plan NOT IN ('pro', 'enterprise') AND s.verification_status != 'verified'"
        )

    order_map = {
        "rating": "s.average_rating DESC NULLS LAST",
        "items": "inv.total_items DESC NULLS LAST",
        "newest": "pp.created_at DESC",
        "name": "pp.handle ASC",
    }
    order_sql = order_map.get(sort, order_map["rating"])
    where_sql = " AND ".join(clauses)

    sql = f"""
        SELECT
          pp.id AS owner_id,
          pp.handle,
          pp.display_name,
          pp.avatar_url,
          COALESCE(pp.country, s.country, 'BR') AS country,
          pp.created_at,
          pp.updated_at,
          s.name AS store_name,
          s.slug AS store_slug,
          s.logo_url AS store_logo,
          s.average_rating,
          s.review_count,
          s.shop_enabled,
          s.subscription_plan,
          s.verification_status,
          COALESCE(inv.total_items, 0)::int AS total_items,
          COALESCE(inv.unique_items, 0)::int AS unique_items
        FROM tcg_judge.player_profiles pp
        JOIN tcg_judge.stores s ON s.owner_id = pp.id
        LEFT JOIN LATERAL (
          SELECT
            SUM(cl.quantity)::int AS total_items,
            COUNT(DISTINCT cl.card_id)::int AS unique_items
          FROM tcg_judge.card_listings cl
          WHERE cl.seller_id = pp.id AND cl.status = 'active' AND cl.quantity > 0
        ) inv ON TRUE
        WHERE {where_sql}
        ORDER BY {order_sql}
        LIMIT :lim OFFSET :off
    """
    count_sql = f"""
        SELECT COUNT(*)::int AS total
        FROM tcg_judge.player_profiles pp
        JOIN tcg_judge.stores s ON s.owner_id = pp.id
        WHERE {where_sql}
    """

    rows = (await session.execute(text(sql), params)).mappings().all()
    total_row = (await session.execute(text(count_sql), params)).mappings().first()
    total = int(total_row["total"]) if total_row else 0

    return {
        "sellers": [_serialize_seller(dict(r)) for r in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit else 0,
    }


async def get_seller_profile(session: AsyncSession, username: str) -> dict[str, Any]:
    row = await _resolve_seller_row(session, username)
    owner_id = str(row["owner_id"])
    total_items, unique_items = await _inventory_stats(session, owner_id)
    row["total_items"] = total_items
    row["unique_items"] = unique_items

    payload = _serialize_seller(row)
    payload["store_description"] = row.get("store_description")
    payload["policies"] = None

    store_id = row.get("store_id")
    if store_id:
        stats = await shop_reviews_svc.get_store_review_stats(session, str(store_id))
        dist = stats.get("distribution") or {}
        payload["rating_summary"] = {
            "average": float(stats.get("average_rating") or 0),
            "total": int(stats.get("total_reviews") or 0),
            "distribution": {str(k): v for k, v in dist.items()},
        }
    else:
        payload["rating_summary"] = {"average": 0, "total": 0, "distribution": {}}

    payload["is_following"] = False
    return payload


def _condition_label(code: str) -> str:
    labels = {
        "NM": "Near Mint",
        "LP": "Lightly Played",
        "MP": "Moderately Played",
        "HP": "Heavily Played",
        "DM": "Damaged",
    }
    return labels.get(code.upper(), code)


def _serialize_product(row: dict[str, Any]) -> dict[str, Any]:
    listing_id = row.get("listing_id")
    product_id = row.get("product_id") or listing_id
    return {
        "id": _stable_numeric_id(str(product_id)),
        "blueprint_id": _stable_numeric_id(str(row.get("card_id") or product_id)),
        "name_en": str(row.get("card_name") or row.get("product_name") or ""),
        "name_pt": None,
        "quantity": int(row.get("quantity") or 0),
        "price": {"cents": int(row.get("price_cents") or 0), "currency": str(row.get("currency") or "BRL")},
        "condition": _condition_label(str(row.get("condition") or "NM")),
        "language": str(row.get("language") or "pt"),
        "foil": bool(row.get("foil")),
        "signed": False,
        "altered": False,
        "graded": False,
        "expansion": {
            "id": _stable_numeric_id(str(row.get("set_code") or "set")),
            "code": str(row.get("set_code") or ""),
            "name_en": str(row.get("set_name") or ""),
        },
        "image_url": normalize_tcgdex_image_url(row.get("image_url")),
    }


async def get_seller_products(
    session: AsyncSession,
    username: str,
    *,
    page: int = 1,
    limit: int = 24,
    condition: str | None = None,
    language: str | None = None,
    foil: bool | None = None,
    signed: bool | None = None,
    altered: bool | None = None,
    graded: bool | None = None,
    price_min: int | None = None,
    price_max: int | None = None,
    game_id: str | None = None,
    sort: Literal["price_asc", "price_desc", "name", "newest"] = "price_asc",
) -> dict[str, Any]:
    row = await _resolve_seller_row(session, username)
    owner_id = str(row["owner_id"])
    page = max(1, page)
    limit = max(1, min(limit, 100))
    offset = (page - 1) * limit

    clauses = [
        "cl.seller_id = :sid",
        "cl.status = 'active'",
        "cl.quantity > 0",
        "s.shop_enabled = true",
    ]
    params: dict[str, Any] = {"sid": owner_id, "lim": limit, "off": offset}

    if condition:
        clauses.append("cl.condition = :cond")
        params["cond"] = condition.upper()[:10]
    if language:
        clauses.append("cl.language = :lang")
        params["lang"] = language.lower()[:10]
    if foil is not None:
        clauses.append("cl.foil = :foil")
        params["foil"] = foil
    if price_min is not None:
        clauses.append("cl.price_cents >= :pmin")
        params["pmin"] = price_min
    if price_max is not None:
        clauses.append("cl.price_cents <= :pmax")
        params["pmax"] = price_max
    if signed or altered or graded:
        clauses.append("FALSE")
    if game_id:
        clauses.append(
            """EXISTS (
                SELECT 1 FROM tcg_judge.catalog_games cg
                WHERE cg.game_code = cc.game_code
                  AND (
                    LOWER(cg.slug) = LOWER(:game_id)
                    OR LOWER(cg.game_code) = REPLACE(LOWER(:game_id), '-', '_')
                  )
            )"""
        )
        params["game_id"] = game_id.strip()

    order_map = {
        "price_asc": "cl.price_cents ASC",
        "price_desc": "cl.price_cents DESC",
        "name": "cc.name ASC",
        "newest": "cl.created_at DESC",
    }
    order_sql = order_map.get(sort, order_map["price_asc"])
    where_sql = " AND ".join(clauses)

    sql = f"""
        SELECT
          cl.id AS listing_id,
          cl.card_id,
          cl.condition,
          cl.price_cents,
          cl.currency,
          cl.quantity,
          cl.foil,
          cl.language,
          cl.created_at,
          p.id AS product_id,
          p.name AS product_name,
          cc.name AS card_name,
          cc.set_code,
          cc.set_name,
          COALESCE(cc.image_url, (cc.image_uris->>'normal')) AS image_url
        FROM tcg_judge.card_listings cl
        JOIN tcg_judge.stores s ON s.id = cl.store_id
        JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
        LEFT JOIN tcg_judge.store_products p ON p.id = cl.store_product_id
        WHERE {where_sql}
        ORDER BY {order_sql}
        LIMIT :lim OFFSET :off
    """
    count_sql = f"""
        SELECT COUNT(*)::int AS total
        FROM tcg_judge.card_listings cl
        JOIN tcg_judge.stores s ON s.id = cl.store_id
        JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
        WHERE {where_sql}
    """

    rows = (await session.execute(text(sql), params)).mappings().all()
    total_row = (await session.execute(text(count_sql), params)).mappings().first()
    total = int(total_row["total"]) if total_row else 0

    return {
        "products": [_serialize_product(dict(r)) for r in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit else 0,
    }


async def get_seller_rating_summary(session: AsyncSession, seller_id: str) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE owner_id = :oid LIMIT 1"),
            {"oid": seller_id},
        )
    ).mappings().first()
    if not store:
        return {"average": 0, "total": 0, "distribution": {}}
    stats = await shop_reviews_svc.get_store_review_stats(session, str(store["id"]))
    dist = stats.get("distribution") or {}
    return {
        "average": float(stats.get("average_rating") or 0),
        "total": int(stats.get("total_reviews") or 0),
        "distribution": {str(k): v for k, v in dist.items()},
    }
