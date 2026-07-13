"""Busca multi-fonte de estoque do vendedor (estilo Liga, dados internos JudgeTCG)."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.games_service import game_code_from_slug, search_game_cards
from app.marketplace import card_listings as card_listings_svc
from app.marketplace import shop_products as shop_products_svc

Source = Literal["my_catalog", "system", "bestsellers_marketplace", "bestsellers_store"]
Kind = Literal["cards", "products"]
StockFilter = Literal["all", "with_stock", "without_stock"]
Period = Literal["day", "week", "month", "year"]
AdjustMode = Literal["set", "add"]

_REVENUE_FILTER = "o.status IN ('paid', 'processing', 'shipped', 'delivered')"

_PERIOD_INTERVAL = {
    "day": "1 day",
    "week": "7 days",
    "month": "30 days",
    "year": "365 days",
}


async def _resolve_store(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT id, slug, name, owner_id
                FROM tcg_judge.stores
                WHERE owner_id = :oid
                ORDER BY created_at ASC
                LIMIT 1
                """
            ),
            {"oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada. Cadastre uma loja primeiro.")
    return dict(row)


def _image_from_uris(image_url: Any, image_uris: Any) -> str | None:
    if image_url:
        return str(image_url)
    if isinstance(image_uris, dict):
        for key in ("normal", "large", "small"):
            if image_uris.get(key):
                return str(image_uris[key])
    return None


def _row_item(**kwargs: Any) -> dict[str, Any]:
    item = {
        "id": kwargs.get("id"),
        "kind": kwargs.get("kind"),
        "title": kwargs.get("title") or "",
        "image_url": kwargs.get("image_url"),
        "game": kwargs.get("game"),
        "set_code": kwargs.get("set_code"),
        "listing_id": kwargs.get("listing_id"),
        "product_id": kwargs.get("product_id"),
        "card_id": kwargs.get("card_id"),
        "quantity": int(kwargs.get("quantity") or 0),
        "price_cents": int(kwargs.get("price_cents") or 0),
        "condition": kwargs.get("condition") or "NM",
        "language": kwargs.get("language") or "pt",
        "foil": bool(kwargs.get("foil") or False),
        "sold_qty": kwargs.get("sold_qty"),
        "category": kwargs.get("category"),
        "sku": kwargs.get("sku"),
        "source": kwargs.get("source") or "manual",
        "status": kwargs.get("status") or "active",
        "last_sync": kwargs.get("last_sync"),
        "sync_history": kwargs.get("sync_history") or [],
    }
    return item


def _derive_source(search_source: str, *, has_listing: bool, kind: str) -> str:
    if search_source == "system":
        return "catalog"
    if search_source.startswith("bestsellers"):
        return "bestsellers"
    if kind == "products" and not has_listing:
        return "manual"
    return "catalog" if kind == "cards" else "manual"


async def search_inventory(
    session: AsyncSession,
    owner_id: str,
    *,
    source: Source = "my_catalog",
    kind: Kind = "cards",
    game: str = "mtg",
    q: str | None = None,
    stock_filter: StockFilter = "all",
    period: Period = "month",
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    store = await _resolve_store(session, owner_id)
    store_id = str(store["id"])
    page = max(1, page)
    limit = min(max(1, limit), 48)

    if kind == "cards":
        items, total = await _search_cards(
            session,
            owner_id=owner_id,
            store_id=store_id,
            source=source,
            game=game,
            q=q,
            stock_filter=stock_filter,
            period=period,
            page=page,
            limit=limit,
        )
    else:
        items, total = await _search_products(
            session,
            owner_id=owner_id,
            store_id=store_id,
            source=source,
            q=q,
            stock_filter=stock_filter,
            period=period,
            page=page,
            limit=limit,
        )

    from app.marketplace.seller_inventory_health import enrich_items_with_health

    for it in items:
        it["source"] = it.get("source") or _derive_source(
            source, has_listing=bool(it.get("listing_id")), kind=str(it.get("kind") or kind)
        )
        it.setdefault("last_sync", None)
        it.setdefault("sync_history", [])

    items = enrich_items_with_health(items)

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "has_more": page * limit < total,
        "source": source,
        "kind": kind,
    }


async def _search_cards(
    session: AsyncSession,
    *,
    owner_id: str,
    store_id: str,
    source: Source,
    game: str,
    q: str | None,
    stock_filter: StockFilter,
    period: Period,
    page: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    code = game_code_from_slug(game)
    if not code:
        raise HTTPException(400, "Jogo inválido")

    if source == "my_catalog":
        return await _cards_my_catalog(
            session, owner_id=owner_id, game_code=code, q=q, stock_filter=stock_filter, page=page, limit=limit
        )
    if source == "system":
        return await _cards_system(
            session, store_id=store_id, game=game, q=q, stock_filter=stock_filter, page=page, limit=limit
        )
    return await _cards_bestsellers(
        session,
        store_id=store_id,
        game_code=code,
        q=q,
        stock_filter=stock_filter,
        period=period,
        page=page,
        limit=limit,
        marketplace_only=source == "bestsellers_marketplace",
    )


async def _cards_my_catalog(
    session: AsyncSession,
    *,
    owner_id: str,
    game_code: str,
    q: str | None,
    stock_filter: StockFilter,
    page: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    clauses = ["cl.seller_id = :sid", "cc.game_code = :g"]
    params: dict[str, Any] = {
        "sid": owner_id,
        "g": game_code,
        "lim": limit,
        "off": (page - 1) * limit,
    }
    if q and q.strip():
        clauses.append("(cc.name ILIKE :q OR COALESCE(cc.set_name, '') ILIKE :q)")
        params["q"] = f"%{q.strip()}%"
    if stock_filter == "with_stock":
        clauses.append("cl.quantity > 0")
    elif stock_filter == "without_stock":
        clauses.append("cl.quantity <= 0")

    where = " AND ".join(clauses)
    total = int(
        (
            await session.execute(
                text(
                    f"""
                    SELECT COUNT(*) AS c
                    FROM tcg_judge.card_listings cl
                    JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
                    WHERE {where}
                    """
                ),
                params,
            )
        ).mappings().first()["c"]
        or 0
    )
    rows = (
        await session.execute(
            text(
                f"""
                SELECT cl.id AS listing_id, cl.card_id, cl.quantity, cl.price_cents,
                       cl.condition, cl.language, cl.foil, cl.store_product_id,
                       cc.name, cc.set_code, cc.set_name, cc.game_code,
                       cc.image_url, cc.image_uris
                FROM tcg_judge.card_listings cl
                JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
                WHERE {where}
                ORDER BY cc.name ASC, cl.updated_at DESC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    items = [
        _row_item(
            id=str(r["listing_id"]),
            kind="cards",
            title=r["name"],
            image_url=_image_from_uris(r.get("image_url"), r.get("image_uris")),
            game=str(r["game_code"]).lower(),
            set_code=r.get("set_code") or r.get("set_name"),
            listing_id=str(r["listing_id"]),
            product_id=str(r["store_product_id"]) if r.get("store_product_id") else None,
            card_id=str(r["card_id"]),
            quantity=r["quantity"],
            price_cents=r["price_cents"],
            condition=r["condition"],
            language=r["language"],
            foil=r["foil"],
        )
        for r in rows
    ]
    return items, total


async def _cards_system(
    session: AsyncSession,
    *,
    store_id: str,
    game: str,
    q: str | None,
    stock_filter: StockFilter,
    page: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    result = await search_game_cards(session, game, q=q or "", page=page, limit=limit)
    cards = result.get("cards") or []
    total = int(result.get("total") or 0)
    if not cards:
        return [], total

    card_ids = [str(c.get("id") or c.get("card_id") or "") for c in cards if c.get("id") or c.get("card_id")]
    listing_map = await _listings_by_card_ids(session, store_id, card_ids)

    items: list[dict[str, Any]] = []
    for c in cards:
        cid = str(c.get("id") or c.get("card_id") or "")
        listing = listing_map.get(cid)
        qty = int(listing["quantity"]) if listing else 0
        if stock_filter == "with_stock" and qty <= 0:
            continue
        if stock_filter == "without_stock" and qty > 0:
            continue
        image = c.get("image_url") or c.get("imageUrl")
        if not image and isinstance(c.get("image_uris") or c.get("imageUris"), dict):
            image = _image_from_uris(None, c.get("image_uris") or c.get("imageUris"))
        set_obj = c.get("set") if isinstance(c.get("set"), dict) else {}
        set_code = (
            c.get("set_code")
            or c.get("setCode")
            or (set_obj.get("code") if set_obj else None)
            or c.get("set_name")
        )
        items.append(
            _row_item(
                id=cid or (listing and str(listing["id"])) or "",
                kind="cards",
                title=c.get("name") or c.get("title") or "",
                image_url=image,
                game=game,
                set_code=set_code,
                listing_id=str(listing["id"]) if listing else None,
                product_id=str(listing["store_product_id"]) if listing and listing.get("store_product_id") else None,
                card_id=cid or None,
                quantity=qty,
                price_cents=int(listing["price_cents"]) if listing else int((c.get("lowest_price_cents") or 0) or 0),
                condition=listing["condition"] if listing else "NM",
                language=listing["language"] if listing else (c.get("language") or "pt"),
                foil=bool(listing["foil"]) if listing else False,
            )
        )
    # stock_filter applied in-memory may shrink page; acceptable for v1
    return items, total


async def _cards_bestsellers(
    session: AsyncSession,
    *,
    store_id: str,
    game_code: str,
    q: str | None,
    stock_filter: StockFilter,
    period: Period,
    page: int,
    limit: int,
    marketplace_only: bool,
) -> tuple[list[dict[str, Any]], int]:
    interval = _PERIOD_INTERVAL.get(period, "30 days")
    clauses = [
        _REVENUE_FILTER,
        f"o.created_at >= NOW() - INTERVAL '{interval}'",
        "sp.catalog_card_id IS NOT NULL",
        "cc.game_code = :g",
    ]
    params: dict[str, Any] = {
        "g": game_code,
        "lim": limit,
        "off": (page - 1) * limit,
        "mystore": store_id,
    }
    if not marketplace_only:
        clauses.append("o.store_id = :mystore")
    if q and q.strip():
        clauses.append("(cc.name ILIKE :q OR i.product_name ILIKE :q)")
        params["q"] = f"%{q.strip()}%"

    where = " AND ".join(clauses)
    count_row = (
        await session.execute(
            text(
                f"""
                SELECT COUNT(*) AS c FROM (
                  SELECT sp.catalog_card_id
                  FROM tcg_judge.shop_order_items i
                  JOIN tcg_judge.shop_orders o ON o.id = i.order_id
                  JOIN tcg_judge.store_products sp ON sp.id = i.product_id
                  JOIN tcg_judge.card_catalog cc ON cc.id = sp.catalog_card_id
                  WHERE {where}
                  GROUP BY sp.catalog_card_id
                ) t
                """
            ),
            params,
        )
    ).mappings().first()
    total = int(count_row["c"] if count_row else 0)

    rows = (
        await session.execute(
            text(
                f"""
                SELECT sp.catalog_card_id AS card_id,
                       MAX(cc.name) AS name,
                       MAX(cc.set_code) AS set_code,
                       MAX(cc.image_url) AS image_url,
                       SUM(i.quantity)::int AS sold_qty
                FROM tcg_judge.shop_order_items i
                JOIN tcg_judge.shop_orders o ON o.id = i.order_id
                JOIN tcg_judge.store_products sp ON sp.id = i.product_id
                JOIN tcg_judge.card_catalog cc ON cc.id = sp.catalog_card_id
                WHERE {where}
                GROUP BY sp.catalog_card_id
                ORDER BY sold_qty DESC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    card_ids = [str(r["card_id"]) for r in rows]
    listing_map = await _listings_by_card_ids(session, store_id, card_ids)

    items: list[dict[str, Any]] = []
    for r in rows:
        cid = str(r["card_id"])
        listing = listing_map.get(cid)
        qty = int(listing["quantity"]) if listing else 0
        if stock_filter == "with_stock" and qty <= 0:
            continue
        if stock_filter == "without_stock" and qty > 0:
            continue
        items.append(
            _row_item(
                id=cid,
                kind="cards",
                title=r["name"],
                image_url=r.get("image_url"),
                game=game_code.lower(),
                set_code=r.get("set_code"),
                listing_id=str(listing["id"]) if listing else None,
                product_id=str(listing["store_product_id"]) if listing and listing.get("store_product_id") else None,
                card_id=cid,
                quantity=qty,
                price_cents=int(listing["price_cents"]) if listing else 0,
                condition=listing["condition"] if listing else "NM",
                language=listing["language"] if listing else "pt",
                foil=bool(listing["foil"]) if listing else False,
                sold_qty=int(r["sold_qty"] or 0),
            )
        )
    return items, total


async def _listings_by_card_ids(
    session: AsyncSession,
    store_id: str,
    card_ids: list[str],
) -> dict[str, dict[str, Any]]:
    ids = [c for c in card_ids if c]
    if not ids:
        return {}
    rows = (
        await session.execute(
            text(
                """
                SELECT DISTINCT ON (card_id)
                       id, card_id, quantity, price_cents, condition, language, foil, store_product_id
                FROM tcg_judge.card_listings
                WHERE store_id = :sid AND card_id = ANY(CAST(:ids AS uuid[]))
                  AND status IN ('active', 'inactive')
                ORDER BY card_id, updated_at DESC
                """
            ),
            {"sid": store_id, "ids": ids},
        )
    ).mappings().all()
    return {str(r["card_id"]): dict(r) for r in rows}


async def _search_products(
    session: AsyncSession,
    *,
    owner_id: str,
    store_id: str,
    source: Source,
    q: str | None,
    stock_filter: StockFilter,
    period: Period,
    page: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    if source == "my_catalog":
        return await _products_my_catalog(
            session, store_id=store_id, q=q, stock_filter=stock_filter, page=page, limit=limit
        )
    if source == "system":
        return await _products_system(
            session, store_id=store_id, q=q, stock_filter=stock_filter, page=page, limit=limit
        )
    return await _products_bestsellers(
        session,
        store_id=store_id,
        q=q,
        stock_filter=stock_filter,
        period=period,
        page=page,
        limit=limit,
        marketplace_only=source == "bestsellers_marketplace",
    )


async def _products_my_catalog(
    session: AsyncSession,
    *,
    store_id: str,
    q: str | None,
    stock_filter: StockFilter,
    page: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    clauses = ["p.store_id = :sid", "p.catalog_card_id IS NULL"]
    params: dict[str, Any] = {"sid": store_id, "lim": limit, "off": (page - 1) * limit}
    if q and q.strip():
        clauses.append("(p.name ILIKE :q OR COALESCE(p.sku, '') ILIKE :q)")
        params["q"] = f"%{q.strip()}%"
    if stock_filter == "with_stock":
        clauses.append("p.stock > 0")
    elif stock_filter == "without_stock":
        clauses.append("p.stock <= 0")

    where = " AND ".join(clauses)
    total = int(
        (
            await session.execute(
                text(f"SELECT COUNT(*) AS c FROM tcg_judge.store_products p WHERE {where}"),
                params,
            )
        ).mappings().first()["c"]
        or 0
    )
    rows = (
        await session.execute(
            text(
                f"""
                SELECT p.id, p.name, p.stock, p.price_cents, p.category, p.images, p.sku
                FROM tcg_judge.store_products p
                WHERE {where}
                ORDER BY p.name ASC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    items = []
    for r in rows:
        images = r.get("images") or []
        image = images[0] if isinstance(images, list) and images else None
        items.append(
            _row_item(
                id=str(r["id"]),
                kind="products",
                title=r["name"],
                image_url=image,
                product_id=str(r["id"]),
                quantity=r["stock"],
                price_cents=r["price_cents"],
                category=r.get("category"),
            )
        )
    return items, total


async def _products_system(
    session: AsyncSession,
    *,
    store_id: str,
    q: str | None,
    stock_filter: StockFilter,
    page: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    """Base interna de produtos: nomes distintos de produtos físicos ativos no marketplace."""
    clauses = ["p.is_active = true", "p.catalog_card_id IS NULL", "s.shop_enabled = true"]
    params: dict[str, Any] = {"lim": limit, "off": (page - 1) * limit, "mystore": store_id}
    if q and q.strip():
        clauses.append("p.name ILIKE :q")
        params["q"] = f"%{q.strip()}%"
    where = " AND ".join(clauses)

    count_row = (
        await session.execute(
            text(
                f"""
                SELECT COUNT(*) AS c FROM (
                  SELECT LOWER(TRIM(p.name)) AS nkey
                  FROM tcg_judge.store_products p
                  JOIN tcg_judge.stores s ON s.id = p.store_id
                  WHERE {where}
                  GROUP BY LOWER(TRIM(p.name))
                ) t
                """
            ),
            params,
        )
    ).mappings().first()
    total = int(count_row["c"] if count_row else 0)

    rows = (
        await session.execute(
            text(
                f"""
                SELECT LOWER(TRIM(p.name)) AS nkey,
                       MAX(p.name) AS name,
                       MAX(p.category) AS category,
                       MIN(p.price_cents) AS price_cents,
                       (ARRAY_AGG(p.images ORDER BY p.created_at DESC))[1] AS images
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE {where}
                GROUP BY LOWER(TRIM(p.name))
                ORDER BY name ASC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    names = [str(r["name"]) for r in rows]
    mine = await _my_products_by_names(session, store_id, names)

    items: list[dict[str, Any]] = []
    for r in rows:
        name = str(r["name"])
        own = mine.get(name.lower().strip())
        qty = int(own["stock"]) if own else 0
        if stock_filter == "with_stock" and qty <= 0:
            continue
        if stock_filter == "without_stock" and qty > 0:
            continue
        images = r.get("images") or (own.get("images") if own else None) or []
        image = images[0] if isinstance(images, list) and images else None
        items.append(
            _row_item(
                id=str(own["id"]) if own else f"tpl:{name}",
                kind="products",
                title=name,
                image_url=image,
                product_id=str(own["id"]) if own else None,
                quantity=qty,
                price_cents=int(own["price_cents"]) if own else int(r["price_cents"] or 0),
                category=own.get("category") if own else r.get("category"),
            )
        )
    return items, total


async def _products_bestsellers(
    session: AsyncSession,
    *,
    store_id: str,
    q: str | None,
    stock_filter: StockFilter,
    period: Period,
    page: int,
    limit: int,
    marketplace_only: bool,
) -> tuple[list[dict[str, Any]], int]:
    interval = _PERIOD_INTERVAL.get(period, "30 days")
    clauses = [
        _REVENUE_FILTER,
        f"o.created_at >= NOW() - INTERVAL '{interval}'",
        "(sp.catalog_card_id IS NULL OR i.product_id IS NOT NULL)",
    ]
    # Prefer physical products: exclude card singles when possible
    clauses.append("(sp.catalog_card_id IS NULL)")
    params: dict[str, Any] = {"lim": limit, "off": (page - 1) * limit, "mystore": store_id}
    if not marketplace_only:
        clauses.append("o.store_id = :mystore")
    if q and q.strip():
        clauses.append("i.product_name ILIKE :q")
        params["q"] = f"%{q.strip()}%"

    where = " AND ".join(clauses)
    count_row = (
        await session.execute(
            text(
                f"""
                SELECT COUNT(*) AS c FROM (
                  SELECT LOWER(TRIM(i.product_name)) AS nkey
                  FROM tcg_judge.shop_order_items i
                  JOIN tcg_judge.shop_orders o ON o.id = i.order_id
                  LEFT JOIN tcg_judge.store_products sp ON sp.id = i.product_id
                  WHERE {where}
                  GROUP BY LOWER(TRIM(i.product_name))
                ) t
                """
            ),
            params,
        )
    ).mappings().first()
    total = int(count_row["c"] if count_row else 0)

    rows = (
        await session.execute(
            text(
                f"""
                SELECT LOWER(TRIM(i.product_name)) AS nkey,
                       MAX(i.product_name) AS name,
                       MAX(i.product_image) AS image_url,
                       MAX(sp.category) AS category,
                       MIN(i.unit_price_cents) AS price_cents,
                       SUM(i.quantity)::int AS sold_qty
                FROM tcg_judge.shop_order_items i
                JOIN tcg_judge.shop_orders o ON o.id = i.order_id
                LEFT JOIN tcg_judge.store_products sp ON sp.id = i.product_id
                WHERE {where}
                GROUP BY LOWER(TRIM(i.product_name))
                ORDER BY sold_qty DESC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    names = [str(r["name"]) for r in rows]
    mine = await _my_products_by_names(session, store_id, names)

    items: list[dict[str, Any]] = []
    for r in rows:
        name = str(r["name"])
        own = mine.get(name.lower().strip())
        qty = int(own["stock"]) if own else 0
        if stock_filter == "with_stock" and qty <= 0:
            continue
        if stock_filter == "without_stock" and qty > 0:
            continue
        items.append(
            _row_item(
                id=str(own["id"]) if own else f"tpl:{name}",
                kind="products",
                title=name,
                image_url=r.get("image_url") or None,
                product_id=str(own["id"]) if own else None,
                quantity=qty,
                price_cents=int(own["price_cents"]) if own else int(r["price_cents"] or 0),
                category=own.get("category") if own else (r.get("category") or "accessory"),
                sold_qty=int(r["sold_qty"] or 0),
            )
        )
    return items, total


async def _my_products_by_names(
    session: AsyncSession,
    store_id: str,
    names: list[str],
) -> dict[str, dict[str, Any]]:
    cleaned = [n.strip() for n in names if n and n.strip()]
    if not cleaned:
        return {}
    rows = (
        await session.execute(
            text(
                """
                SELECT DISTINCT ON (LOWER(TRIM(name)))
                       id, name, stock, price_cents, category, images
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND catalog_card_id IS NULL
                  AND LOWER(TRIM(name)) = ANY(CAST(:names AS text[]))
                ORDER BY LOWER(TRIM(name)), updated_at DESC
                """
            ),
            {"sid": store_id, "names": [n.lower() for n in cleaned]},
        )
    ).mappings().all()
    return {str(r["name"]).lower().strip(): dict(r) for r in rows}


async def adjust_inventory(
    session: AsyncSession,
    owner_id: str,
    *,
    kind: Kind,
    mode: AdjustMode,
    quantity: int,
    listing_id: str | None = None,
    product_id: str | None = None,
    card_id: str | None = None,
    price_cents: int | None = None,
    condition: str | None = None,
    language: str | None = None,
    foil: bool = False,
    title: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    if quantity < 0:
        raise HTTPException(400, "Quantidade inválida")
    if mode not in ("set", "add"):
        raise HTTPException(400, "mode deve ser set ou add")

    store = await _resolve_store(session, owner_id)
    store_id = str(store["id"])

    if kind == "cards":
        return await _adjust_card(
            session,
            owner_id=owner_id,
            store_id=store_id,
            mode=mode,
            quantity=quantity,
            listing_id=listing_id,
            card_id=card_id,
            price_cents=price_cents,
            condition=condition,
            language=language,
            foil=foil,
        )
    return await _adjust_product(
        session,
        owner_id=owner_id,
        store_id=store_id,
        mode=mode,
        quantity=quantity,
        product_id=product_id,
        price_cents=price_cents,
        title=title,
        category=category,
    )


async def _adjust_card(
    session: AsyncSession,
    *,
    owner_id: str,
    store_id: str,
    mode: AdjustMode,
    quantity: int,
    listing_id: str | None,
    card_id: str | None,
    price_cents: int | None,
    condition: str | None,
    language: str | None,
    foil: bool,
) -> dict[str, Any]:
    cond = (condition or "NM").upper()
    lang = (language or "pt").lower()[:10]

    if listing_id:
        existing = await card_listings_svc.get_listing_by_id(session, listing_id)
        if str(existing.get("sellerId") or existing.get("seller_id") or "") != owner_id and str(
            existing.get("storeId") or ""
        ) != store_id:
            # get_listing doesn't always expose seller check — update_listing enforces ownership
            pass
        current_qty = int(existing.get("quantity") or 0)
        new_qty = quantity if mode == "set" else current_qty + quantity
        if new_qty < 0:
            raise HTTPException(400, "Estoque resultante inválido")
        fields: dict[str, Any] = {"quantity": new_qty}
        if price_cents is not None and price_cents > 0:
            fields["price_cents"] = price_cents
        listing = await card_listings_svc.update_listing(session, listing_id, owner_id, fields)
        return {"item": listing, "created": False}

    if not card_id:
        raise HTTPException(400, "Informe listing_id ou card_id")

    # Find existing listing for card+condition+foil+lang
    row = (
        await session.execute(
            text(
                """
                SELECT id, quantity, price_cents FROM tcg_judge.card_listings
                WHERE store_id = :sid AND card_id = :cid
                  AND condition = :cond AND foil = :foil AND language = :lang
                ORDER BY updated_at DESC
                LIMIT 1
                """
            ),
            {"sid": store_id, "cid": card_id, "cond": cond, "foil": foil, "lang": lang},
        )
    ).mappings().first()

    if row:
        current_qty = int(row["quantity"] or 0)
        new_qty = quantity if mode == "set" else current_qty + quantity
        if new_qty < 0:
            raise HTTPException(400, "Estoque resultante inválido")
        fields = {"quantity": new_qty}
        if price_cents is not None and price_cents > 0:
            fields["price_cents"] = price_cents
        listing = await card_listings_svc.update_listing(session, str(row["id"]), owner_id, fields)
        return {"item": listing, "created": False}

    create_qty = quantity if mode == "set" else quantity
    if create_qty < 1:
        raise HTTPException(400, "Quantidade mínima 1 para criar listagem")
    cents = price_cents if price_cents and price_cents > 0 else 100
    listing = await card_listings_svc.create_listing(
        session,
        owner_id,
        card_id=card_id,
        condition=cond,
        price_cents=cents,
        quantity=create_qty,
        foil=foil,
        language=lang,
    )
    return {"item": listing, "created": True}


async def _adjust_product(
    session: AsyncSession,
    *,
    owner_id: str,
    store_id: str,
    mode: AdjustMode,
    quantity: int,
    product_id: str | None,
    price_cents: int | None,
    title: str | None,
    category: str | None,
) -> dict[str, Any]:
    if product_id:
        existing = (
            await session.execute(
                text(
                    """
                    SELECT p.* FROM tcg_judge.store_products p
                    JOIN tcg_judge.stores s ON s.id = p.store_id
                    WHERE p.id = :id AND s.owner_id = :oid
                    """
                ),
                {"id": product_id, "oid": owner_id},
            )
        ).mappings().first()
        if not existing:
            raise HTTPException(404, "Produto não encontrado")
        current = int(existing["stock"] or 0)
        new_qty = quantity if mode == "set" else current + quantity
        if new_qty < 0:
            raise HTTPException(400, "Estoque resultante inválido")
        fields: dict[str, Any] = {"stock": new_qty}
        if price_cents is not None and price_cents > 0:
            fields["price_cents"] = price_cents
        product = await shop_products_svc.update_product(session, product_id, owner_id, fields)
        return {"item": product, "created": False}

    if not title or not title.strip():
        raise HTTPException(400, "Informe product_id ou title para criar produto")

    # Match by name in store
    existing = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.store_products
                WHERE store_id = :sid AND catalog_card_id IS NULL
                  AND LOWER(TRIM(name)) = LOWER(TRIM(:name))
                ORDER BY updated_at DESC
                LIMIT 1
                """
            ),
            {"sid": store_id, "name": title.strip()},
        )
    ).mappings().first()

    if existing:
        current = int(existing["stock"] or 0)
        new_qty = quantity if mode == "set" else current + quantity
        fields = {"stock": new_qty}
        if price_cents is not None and price_cents > 0:
            fields["price_cents"] = price_cents
        product = await shop_products_svc.update_product(session, str(existing["id"]), owner_id, fields)
        return {"item": product, "created": False}

    create_qty = quantity if mode == "set" else quantity
    cents = price_cents if price_cents and price_cents > 0 else 100
    cat = category if category in shop_products_svc.PRODUCT_CATEGORIES else "accessory"
    product = await shop_products_svc.create_product(
        session,
        store_id,
        owner_id,
        name=title.strip(),
        description=None,
        tcg_id=None,
        category=cat,
        price_cents=cents,
        stock=max(0, create_qty),
    )
    return {"item": product, "created": True}
