"""Catálogo Mestre — produtos selados e acessórios."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Header, Query
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.marketplace import seller_dashboard as seller_dash
from app.marketplace import shop_products as shop_products_svc

router = APIRouter(tags=["product-catalog"])


@router.get("/runtime/judge/product-catalog/taxonomy")
async def product_catalog_taxonomy() -> dict[str, Any]:
    """Categorias/subcategorias oficiais (espelho do domínio TS)."""
    from app.product_catalog.taxonomy import OFFICIAL_TAXONOMY

    return {"taxonomy": OFFICIAL_TAXONOMY, "generated_at": datetime.now(UTC).isoformat()}


@router.get("/runtime/judge/product-catalog/search")
async def search_master_products(
    session: DbSession,
    q: str = Query("", min_length=0),
    category: str | None = Query(default=None),
    game: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
) -> dict[str, Any]:
    offset = (page - 1) * limit
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    where = ["1=1"]
    if q.strip():
        where.append(
            """(
              p.search_vector @@ plainto_tsquery('portuguese', :q_plain)
              OR p.title_pt % :q_plain
              OR p.normalized_title ILIKE :q_norm
              OR p.sku ILIKE :q
              OR EXISTS (
                SELECT 1 FROM product_catalog.product_games pg
                JOIN product_catalog.games g ON g.id = pg.game_id
                WHERE pg.product_id = p.id AND g.code ILIKE :q_game
              )
            )"""
        )
        params["q_plain"] = q.strip()
        params["q_norm"] = f"%{q.strip().lower()}%"
        params["q"] = f"%{q.strip()}%"
        params["q_game"] = f"%{q.strip().upper()}%"
    if category:
        where.append("p.category = :category")
        params["category"] = category
    if game:
        where.append(
            """EXISTS (
              SELECT 1 FROM product_catalog.product_games pg
              JOIN product_catalog.games g ON g.id = pg.game_id
              WHERE pg.product_id = p.id AND g.code = :game
            )"""
        )
        params["game"] = game.upper()
    sql = f"""
        SELECT
          p.id AS product_id,
          p.title_pt,
          p.category,
          p.product_type,
          p.subcategory,
          p.game,
          p.sku,
          v.id AS variant_id,
          v.variant_name,
          (
            SELECT a.cdn_url FROM media.asset_links l
            JOIN media.assets a ON a.id = l.asset_id
            WHERE l.entity_type = 'product_variant' AND l.entity_id = v.id
            ORDER BY CASE l.role WHEN 'primary' THEN 0 ELSE 1 END, l.sort_order
            LIMIT 1
          ) AS image_url
        FROM product_catalog.products p
        JOIN product_catalog.variants v ON v.product_id = p.id
        WHERE {" AND ".join(where)}
        ORDER BY p.title_pt ASC
        LIMIT :limit OFFSET :offset
    """
    try:
        res = await session.execute(text(sql), params)
        rows = [dict(r._mapping) for r in res.fetchall()]
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc
    return {"items": rows, "page": page, "limit": limit}


@router.get("/runtime/judge/product-catalog/admin/stats")
async def product_catalog_admin_stats(session: DbSession) -> dict[str, Any]:
    try:
        counts = await session.execute(
            text(
                """
                SELECT
                  (SELECT count(*) FROM product_catalog.products) AS products,
                  (SELECT count(*) FROM product_catalog.variants) AS variants,
                  (SELECT count(*) FROM media.assets) AS assets,
                  (SELECT count(*) FROM media.asset_links) AS asset_links,
                  (SELECT count(*) FROM product_catalog.manufacturers) AS manufacturers,
                  (SELECT count(*) FROM product_catalog.brands) AS brands,
                  (SELECT count(*) FROM product_catalog.games) AS games,
                  (SELECT count(*) FROM product_catalog.collections) AS collections
                """
            )
        )
        row = dict(counts.fetchone()._mapping)
        avg_sync = await session.execute(
            text(
                """
                SELECT avg(duration_ms)::int AS avg_duration_ms
                FROM product_catalog.sync_runs
                WHERE duration_ms IS NOT NULL AND started_at > now() - interval '30 days'
                """
            )
        )
        avg_ms = avg_sync.scalar()
        if avg_ms is not None:
            row["avg_sync_duration_ms"] = avg_ms
        providers = await session.execute(
            text(
                """
                SELECT provider_id, category, last_sync_at, last_status, last_error
                FROM product_catalog.provider_registry
                ORDER BY updated_at DESC
                LIMIT 30
                """
            )
        )
        by_cat = await session.execute(
            text(
                """
                SELECT category, count(*) AS total
                FROM product_catalog.products
                GROUP BY category
                ORDER BY total DESC
                """
            )
        )
        by_mfr = await session.execute(
            text(
                """
                SELECT m.name, count(p.id) AS total
                FROM product_catalog.manufacturers m
                LEFT JOIN product_catalog.products p ON p.manufacturer_id = m.id
                GROUP BY m.name
                ORDER BY total DESC
                LIMIT 20
                """
            )
        )
        last_sync = await session.execute(
            text(
                """
                SELECT job_key, provider_id, status, started_at, finished_at, items_upserted, errors
                FROM product_catalog.sync_runs
                ORDER BY started_at DESC
                LIMIT 10
                """
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc

    return {
        "counts": row,
        "by_category": [dict(r._mapping) for r in by_cat.fetchall()],
        "by_manufacturer": [dict(r._mapping) for r in by_mfr.fetchall()],
        "recent_syncs": [dict(r._mapping) for r in last_sync.fetchall()],
        "providers": [dict(r._mapping) for r in providers.fetchall()],
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/catalog/products")
async def public_catalog_products(
    session: DbSession,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
) -> dict[str, Any]:
    """API pública (parceiros) — listagem paginada."""
    return await search_master_products(session, q="", page=page, limit=limit)


@router.get("/runtime/judge/catalog/variants/{variant_id}")
async def public_catalog_variant(session: DbSession, variant_id: str) -> dict[str, Any]:
    res = await session.execute(
        text(
            """
            SELECT v.*, p.title_pt, p.category, p.product_type
            FROM product_catalog.variants v
            JOIN product_catalog.products p ON p.id = v.product_id
            WHERE v.id = CAST(:id AS uuid)
            """
        ),
        {"id": variant_id},
    )
    row = res.fetchone()
    if not row:
        raise HTTPException(404, detail="not_found")
    return {"variant": dict(row._mapping)}


@router.get("/runtime/judge/catalog/search")
async def public_catalog_search(
    session: DbSession,
    q: str = Query(""),
    category: str | None = None,
    game: str | None = None,
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    return await search_master_products(session, q=q, category=category, game=game, page=page, limit=limit)


@router.get("/runtime/judge/catalog/manufacturers")
async def public_catalog_manufacturers(session: DbSession) -> dict[str, Any]:
    res = await session.execute(text("SELECT id, name, website FROM product_catalog.manufacturers ORDER BY name"))
    return {"items": [dict(r._mapping) for r in res.fetchall()]}


@router.get("/runtime/judge/catalog/brands")
async def public_catalog_brands(session: DbSession) -> dict[str, Any]:
    res = await session.execute(
        text(
            """
            SELECT b.id, b.name, m.name AS manufacturer
            FROM product_catalog.brands b
            JOIN product_catalog.manufacturers m ON m.id = b.manufacturer_id
            ORDER BY b.name
            """
        )
    )
    return {"items": [dict(r._mapping) for r in res.fetchall()]}


@router.get("/runtime/judge/catalog/games")
async def public_catalog_games(session: DbSession) -> dict[str, Any]:
    res = await session.execute(text("SELECT code, name FROM product_catalog.games ORDER BY name"))
    return {"items": [dict(r._mapping) for r in res.fetchall()]}


@router.post("/runtime/judge/product-catalog/seller/listings")
async def publish_seller_master_listing(
    session: DbSession,
    body: dict[str, Any],
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    """Lojista publica oferta atrelada a variante do catálogo mestre (preço/estoque/condição)."""
    user_id = _require_user(x_judge_user_id)
    variant_id = body.get("variant_id")
    price_cents = body.get("price_cents")
    stock = body.get("stock", 0)
    condition = body.get("condition", "NEW")
    if not variant_id or not price_cents:
        raise HTTPException(status_code=400, detail="variant_id_and_price_required")
    store = await seller_dash.resolve_owner_store(session, user_id)
    store_id = str(store["id"])

    meta = await session.execute(
        text(
            """
            SELECT p.title_pt, p.category, p.subcategory, v.variant_name,
                   (
                     SELECT a.cdn_url FROM media.asset_links l
                     JOIN media.assets a ON a.id = l.asset_id
                     WHERE l.entity_type = 'product_variant' AND l.entity_id = v.id
                     ORDER BY CASE l.role WHEN 'primary' THEN 0 ELSE 1 END, l.sort_order
                     LIMIT 1
                   ) AS image_url
            FROM product_catalog.variants v
            JOIN product_catalog.products p ON p.id = v.product_id
            WHERE v.id = CAST(:vid AS uuid)
            """
        ),
        {"vid": variant_id},
    )
    meta_row = meta.fetchone()
    if not meta_row:
        raise HTTPException(status_code=404, detail="variant_not_found")

    title_pt = meta_row[0]
    category_map = {
        "SEALED_PRODUCT": "booster_box",
        "SLEEVES": "sleeve",
        "DECK_BOX": "deck_box",
        "BINDER": "album",
        "PLAYMAT": "playmat",
    }
    legacy_category = category_map.get(meta_row[1], "accessory")
    image_url = meta_row[4]

    await session.execute(
        text(
            """
            INSERT INTO product_catalog.seller_products (store_id, variant_id, stock, price_cents, condition)
            VALUES (CAST(:store_id AS uuid), CAST(:variant_id AS uuid), :stock, :price_cents, :condition)
            ON CONFLICT (store_id, variant_id, condition) DO UPDATE SET
              stock = EXCLUDED.stock,
              price_cents = EXCLUDED.price_cents,
              updated_at = now(),
              is_active = true
            """
        ),
        {
            "store_id": store_id,
            "variant_id": variant_id,
            "stock": int(stock),
            "price_cents": int(price_cents),
            "condition": condition,
        },
    )

    images = [image_url] if image_url else []
    product = await shop_products_svc.create_product(
        session,
        store_id,
        user_id,
        name=title_pt,
        description=f"{meta_row[3]} — catálogo mestre ({condition})",
        tcg_id=None,
        category=legacy_category,
        price_cents=int(price_cents),
        stock=int(stock),
        images=images,
    )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.store_products
            SET master_variant_id = CAST(:variant_id AS uuid)
            WHERE id = CAST(:pid AS uuid)
            """
        ),
        {"variant_id": variant_id, "pid": product["id"]},
    )
    await session.commit()
    return {
        "ok": True,
        "seller_product_variant_id": variant_id,
        "store_product_id": product["id"],
        "condition": condition,
    }
