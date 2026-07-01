"""CRUD de produtos da loja (marketplace físico)."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_store import STORE_SELLABLE_SQL, effective_plan, product_limit_for_plan

PRODUCT_CATEGORIES = frozenset({
    "single",
    "oversized",
    "token",
    "booster",
    "booster_box",
    "starter_deck",
    "preconstructed_deck",
    "bundle",
    "box_set_display",
    "tin",
    "complete_set",
    "sleeve",
    "album",
    "deck_box",
    "playmat",
    "dice",
    "accessory",
    "empty_storage",
    "blisters",
    "prerelease_pack",
    "memorabilia",
    "don_card",
    "memory_gauge",
    "art_card_token",
})


async def _assert_store_owner(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    return dict(row)


async def list_products(
    session: AsyncSession,
    *,
    tcg_id: str | None = None,
    category: str | None = None,
    store_id: str | None = None,
    store_slug: str | None = None,
    search: str | None = None,
    min_price_cents: int | None = None,
    max_price_cents: int | None = None,
    conditions: list[str] | None = None,
    in_stock: bool | None = None,
    sort: str = "created_at",
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    clauses = ["p.is_active = true", STORE_SELLABLE_SQL.strip()]
    params: dict[str, Any] = {"lim": limit, "off": max(0, (page - 1) * limit)}
    if tcg_id:
        clauses.append("p.tcg_id = :tcg")
        params["tcg"] = tcg_id
    if category:
        if category not in PRODUCT_CATEGORIES:
            raise HTTPException(400, "Categoria inválida")
        clauses.append("p.category = :cat")
        params["cat"] = category
    if store_id:
        clauses.append("p.store_id = :sid")
        params["sid"] = store_id
    if store_slug:
        clauses.append("LOWER(s.slug) = LOWER(:slug)")
        params["slug"] = store_slug
    if search:
        from app.core.search.syntax_parser import syntax_parser

        parsed = syntax_parser.parse(search)
        if parsed["filters"]:
            syntax_clauses, syntax_params = syntax_parser.shop_sql_clauses(parsed)
            clauses.extend(syntax_clauses)
            params.update(syntax_params)
        text_q = parsed["text_query"] or (
            search if not parsed["filters"] else ""
        )
        if text_q:
            clauses.append("p.name ILIKE :q")
            params["q"] = f"%{text_q.strip()}%"
    if min_price_cents is not None:
        clauses.append("p.price_cents >= :minp")
        params["minp"] = min_price_cents
    if max_price_cents is not None:
        clauses.append("p.price_cents <= :maxp")
        params["maxp"] = max_price_cents
    if in_stock:
        clauses.append("p.stock > 0")
    if conditions:
        clauses.append(
            """
            EXISTS (
              SELECT 1 FROM tcg_judge.card_listings cl
              WHERE cl.store_product_id = p.id
                AND cl.status = 'active'
                AND cl.condition = ANY(:conditions)
            )
            """
        )
        params["conditions"] = conditions

    order = "p.created_at DESC"
    if sort == "price_asc":
        order = "p.price_cents ASC"
    elif sort == "price_desc":
        order = "p.price_cents DESC"
    elif sort == "name":
        order = "p.name ASC"

    where_sql = " AND ".join(clauses)
    sql = f"""
        SELECT p.*,
               s.name AS store_name,
               s.slug AS store_slug,
               s.logo_url AS store_logo_url
        FROM tcg_judge.store_products p
        JOIN tcg_judge.stores s ON s.id = p.store_id
        WHERE {where_sql}
        ORDER BY {order}
        LIMIT :lim OFFSET :off
    """
    count_sql = f"""
        SELECT COUNT(*)::int AS total
        FROM tcg_judge.store_products p
        JOIN tcg_judge.stores s ON s.id = p.store_id
        WHERE {where_sql}
    """
    rows = (await session.execute(text(sql), params)).mappings().all()
    total_row = (await session.execute(text(count_sql), params)).mappings().first()
    total = int(total_row["total"]) if total_row else 0
    return {
        "products": [dict(r) for r in rows],
        "page": page,
        "limit": limit,
        "total": total,
        "hasMore": page * limit < total,
    }


async def get_product(session: AsyncSession, product_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT p.*,
                       s.name AS store_name,
                       s.slug AS store_slug,
                       s.logo_url AS store_logo_url,
                       s.id AS store_id_ref
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE p.id = :id AND p.is_active = true AND {STORE_SELLABLE_SQL.strip()}
                """
            ),
            {"id": product_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def create_product(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    name: str,
    description: str | None,
    tcg_id: str | None,
    category: str,
    price_cents: int,
    compare_at_price_cents: int | None = None,
    stock: int = 0,
    sku: str | None = None,
    images: list[str] | None = None,
) -> dict[str, Any]:
    from app.kyc.merchant_kyc import require_verified_merchant

    store = await _assert_store_owner(session, store_id, owner_id)
    await require_verified_merchant(session, owner_id)
    limit = product_limit_for_plan(effective_plan(store))
    if limit is not None:
        count_row = (
            await session.execute(
                text("SELECT COUNT(*) AS c FROM tcg_judge.store_products WHERE store_id = :sid"),
                {"sid": store_id},
            )
        ).mappings().first()
        if count_row and int(count_row["c"]) >= limit:
            raise HTTPException(
                403,
                f"Limite de {limit} produtos no plano atual. Faça upgrade em /vendedor/painel/planos.",
            )
    if category not in PRODUCT_CATEGORIES:
        raise HTTPException(400, "Categoria inválida")
    if price_cents <= 0:
        raise HTTPException(400, "Preço inválido")

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.store_products (
                  store_id, name, description, tcg_id, category,
                  price_cents, compare_at_price_cents, stock, sku, images
                ) VALUES (
                  :sid, :name, :desc, :tcg, :cat,
                  :price, :compare, :stock, :sku, :images
                )
                RETURNING *
                """
            ),
            {
                "sid": store_id,
                "name": name.strip(),
                "desc": description,
                "tcg": tcg_id,
                "cat": category,
                "price": price_cents,
                "compare": compare_at_price_cents,
                "stock": stock,
                "sku": sku,
                "images": images or [],
            },
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def update_product(
    session: AsyncSession,
    product_id: str,
    owner_id: str,
    fields: dict[str, Any],
) -> dict[str, Any]:
    existing = (
        await session.execute(
            text(
                """
                SELECT p.*, s.owner_id
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE p.id = :id
                """
            ),
            {"id": product_id},
        )
    ).mappings().first()
    if not existing or existing["owner_id"] != owner_id:
        raise HTTPException(404, "Produto não encontrado")

    allowed = {
        "name", "description", "tcg_id", "category", "price_cents",
        "compare_at_price_cents", "stock", "sku", "images", "is_active",
    }
    sets: list[str] = []
    params: dict[str, Any] = {"id": product_id}
    for k, v in fields.items():
        if k not in allowed or v is None:
            continue
        if k == "category" and v not in PRODUCT_CATEGORIES:
            raise HTTPException(400, "Categoria inválida")
        sets.append(f"{k} = :{k}")
        params[k] = v
    if not sets:
        raise HTTPException(400, "Nada para atualizar")

    row = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.store_products
                SET {', '.join(sets)}, updated_at = NOW()
                WHERE id = :id
                RETURNING *
                """
            ),
            params,
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def list_store_products(
    session: AsyncSession, store_id: str, owner_id: str
) -> list[dict[str, Any]]:
    await _assert_store_owner(session, store_id, owner_id)
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.store_products
                WHERE store_id = :sid
                ORDER BY created_at DESC
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
