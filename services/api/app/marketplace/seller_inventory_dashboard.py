"""Inventory Dashboard — actions-oriented KPIs (Application Layer)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_inventory_search import _resolve_store


async def get_inventory_dashboard(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await _resolve_store(session, owner_id)
    store_id = str(store["id"])

    products = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (WHERE is_active) AS active_products,
                  COUNT(*) FILTER (WHERE is_active AND stock <= 0) AS out_of_stock,
                  COUNT(*) FILTER (WHERE is_active AND stock > 0 AND stock <= 3) AS low_stock,
                  COUNT(*) FILTER (
                    WHERE is_active AND (images IS NULL OR images = '{}' OR cardinality(images) = 0)
                  ) AS missing_image,
                  COUNT(*) FILTER (WHERE is_active AND price_cents <= 0) AS missing_price,
                  COUNT(*) FILTER (WHERE NOT is_active) AS unpublished,
                  COUNT(*) FILTER (WHERE NOT is_active) AS archived,
                  COALESCE(SUM(stock) FILTER (WHERE is_active), 0) AS total_units,
                  COALESCE(SUM(stock * price_cents) FILTER (WHERE is_active), 0) AS value_cents
                FROM tcg_judge.store_products p
                WHERE p.store_id = :sid
                  AND NOT EXISTS (
                    SELECT 1 FROM tcg_judge.card_listings cl
                    WHERE cl.store_product_id = p.id
                  )
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first() or {}

    listings = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (WHERE status = 'active') AS active_listings,
                  COUNT(*) FILTER (WHERE status = 'active' AND quantity <= 0) AS out_of_stock_listings,
                  COUNT(*) FILTER (WHERE status = 'active' AND quantity > 0 AND quantity <= 3) AS low_stock_listings,
                  COUNT(*) FILTER (WHERE status = 'inactive') AS unpublished_listings,
                  COUNT(*) FILTER (WHERE status = 'inactive') AS archived_listings,
                  COALESCE(SUM(quantity) FILTER (WHERE status = 'active'), 0) AS total_card_units,
                  COALESCE(SUM(quantity * price_cents) FILTER (WHERE status = 'active'), 0) AS listings_value_cents
                FROM tcg_judge.card_listings
                WHERE store_id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first() or {}

    missing_listing_images = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM tcg_judge.card_listings cl
                JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
                WHERE cl.store_id = :sid AND cl.status = 'active'
                  AND COALESCE(cc.image_url, '') = ''
                  AND (cc.image_uris IS NULL OR cc.image_uris::text IN ('{}', 'null'))
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    duplicate_products = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM tcg_judge.store_products p
                WHERE p.store_id = :sid
                  AND p.is_active
                  AND p.category IN ('single', 'oversized', 'token')
                  AND (
                    EXISTS (
                      SELECT 1 FROM tcg_judge.store_products p2
                      WHERE p2.store_id = p.store_id
                        AND p2.is_active
                        AND p2.id <> p.id
                        AND p2.category IN ('single', 'oversized', 'token')
                        AND (
                          (
                            p.catalog_card_id IS NOT NULL
                            AND p2.catalog_card_id = p.catalog_card_id
                            AND COALESCE(p.language, 'pt') = COALESCE(p2.language, 'pt')
                          )
                          OR (
                            lower(trim(p.name)) = lower(trim(p2.name))
                            AND COALESCE(p.sku, '') = COALESCE(p2.sku, '')
                          )
                        )
                    )
                    OR (
                      p.catalog_card_id IS NOT NULL
                      AND EXISTS (
                        SELECT 1 FROM tcg_judge.card_listings cl2
                        WHERE cl2.store_id = p.store_id
                          AND cl2.card_id = p.catalog_card_id
                          AND cl2.status = 'active'
                      )
                    )
                  )
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    duplicate_listings = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM tcg_judge.card_listings cl
                WHERE cl.store_id = :sid
                  AND cl.status = 'active'
                  AND EXISTS (
                    SELECT 1 FROM tcg_judge.card_listings cl2
                    WHERE cl2.store_id = cl.store_id
                      AND cl2.id <> cl.id
                      AND cl2.card_id = cl.card_id
                      AND cl2.condition = cl.condition
                      AND cl2.foil = cl.foil
                  )
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    dup_count = int((duplicate_products or {}).get("c") or 0) + int(
        (duplicate_listings or {}).get("c") or 0
    )

    actions = [
        {
            "id": "out_of_stock",
            "label": "Sem estoque",
            "count": int(products.get("out_of_stock") or 0) + int(listings.get("out_of_stock_listings") or 0),
            "filter": {"stock_filter": "without_stock"},
        },
        {
            "id": "low_stock",
            "label": "Abaixo do mínimo",
            "count": int(products.get("low_stock") or 0) + int(listings.get("low_stock_listings") or 0),
            "filter": {"stock_filter": "with_stock", "max_stock": 3},
        },
        {
            "id": "missing_image",
            "label": "Sem imagem",
            "count": int(products.get("missing_image") or 0) + int((missing_listing_images or {}).get("c") or 0),
            "filter": {"health": "missing_image"},
        },
        {
            "id": "missing_price",
            "label": "Sem preço",
            "count": int(products.get("missing_price") or 0),
            "filter": {"health": "missing_price"},
        },
        {
            "id": "unpublished",
            "label": "Não publicados",
            "count": int(products.get("unpublished") or 0) + int(listings.get("unpublished_listings") or 0),
            "filter": {"status": "inactive", "game": "all"},
        },
        {
            "id": "archived",
            "label": "Arquivados",
            "count": int(products.get("archived") or 0) + int(listings.get("archived_listings") or 0),
            "filter": {"status": "inactive", "game": "all"},
        },
        {
            "id": "awaiting_review",
            "label": "Aguardando revisão",
            "count": 0,
            "filter": {"status": "review"},
            "note": "MVP: sem fila de revisão persistida",
        },
        {
            "id": "sync_error",
            "label": "Erro de sincronização",
            "count": 0,
            "filter": {"health": "sync_error"},
            "note": "MVP: sync externo ainda não habilitado",
        },
        {
            "id": "duplicates",
            "label": "Duplicados",
            "count": dup_count,
            "filter": {"health": "duplicate"},
        },
        {
            "id": "recent_import",
            "label": "Recém importados",
            "count": 0,
            "filter": {"source": "csv"},
            "note": "MVP: histórico de import local no cliente",
        },
    ]

    return {
        "store_id": store_id,
        "actions": actions,
        "totals": {
            "active_products": int(products.get("active_products") or 0),
            "active_listings": int(listings.get("active_listings") or 0),
            "total_units": int(products.get("total_units") or 0) + int(listings.get("total_card_units") or 0),
            "value_cents": int(products.get("value_cents") or 0) + int(listings.get("listings_value_cents") or 0),
        },
    }
