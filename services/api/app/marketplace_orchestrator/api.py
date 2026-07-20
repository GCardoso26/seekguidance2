"""Marketplace orchestrator API — coordena Catalog/Pricing/Inventory via Saga."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.marketplace import seller_dashboard as seller_dash

router = APIRouter(tags=["marketplace-orchestrator"])


class PublishProductListingBody(BaseModel):
    variant_id: str
    price_cents: int = Field(gt=0)
    stock: int = Field(ge=0)
    condition: str = "NEW"


@router.post("/runtime/judge/marketplace/listings/product")
async def publish_product_listing(
    session: DbSession,
    body: PublishProductListingBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    """
    Publica anúncio de produto do Catálogo Mestre.
    Marketplace só orquestra — estoque/preço/search via eventos/saga (worker TS).
    Aqui: grava listing + emite eventos; bridge legado store_products opcional.
    """
    user_id = _require_user(x_judge_user_id)
    store = await seller_dash.resolve_owner_store(session, user_id)
    store_id = str(store["id"])
    request_id = str(uuid4())

    # Valida variante no Catalog (somente referência)
    meta = await session.execute(
        text(
            """
            SELECT v.id, p.title_pt
            FROM product_catalog.variants v
            JOIN product_catalog.products p ON p.id = v.product_id
            WHERE v.id = CAST(:vid AS uuid)
            """
        ),
        {"vid": body.variant_id},
    )
    if not meta.fetchone():
        raise HTTPException(404, detail="variant_not_found")

    # Ensure seller row (marketplace.sellers)
    await session.execute(
        text(
            """
            INSERT INTO marketplace.sellers (id, display_name, slug, status)
            VALUES (CAST(:id AS uuid), :name, :slug, 'active')
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {
            "id": store_id,
            "name": store.get("name") or f"Loja {store_id[:8]}",
            "slug": f"store-{store_id}",
        },
    )

    listing_id = str(uuid4())
    await session.execute(
        text(
            """
            INSERT INTO marketplace.listings (
              id, seller_id, subject_type, product_variant_id,
              price_cents, currency, condition, language, quantity, status, published_at
            ) VALUES (
              CAST(:id AS uuid), CAST(:seller AS uuid), 'product_variant', CAST(:vid AS uuid),
              :price, 'BRL', :cond, 'pt-BR', :stock, 'active', now()
            )
            """
        ),
        {
            "id": listing_id,
            "seller": store_id,
            "vid": body.variant_id,
            "price": body.price_cents,
            "cond": body.condition,
            "stock": body.stock,
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO marketplace.listing_status (listing_id, to_status, reason, actor_id)
            VALUES (CAST(:id AS uuid), 'active', 'api_publish', :actor)
            """
        ),
        {"id": listing_id, "actor": user_id},
    )
    await session.execute(
        text(
            """
            INSERT INTO marketplace.listing_metrics (listing_id)
            VALUES (CAST(:id AS uuid))
            ON CONFLICT DO NOTHING
            """
        ),
        {"id": listing_id},
    )

    # domain_events — Saga worker / consumers reagem
    await session.execute(
        text(
            """
            INSERT INTO platform.domain_events (
              event_type, aggregate_type, aggregate_id, payload, metadata
            ) VALUES (
              'MarketplaceListingCreated', 'listing', :lid,
              CAST(:payload AS jsonb), CAST(:meta AS jsonb)
            )
            """
        ),
        {
            "lid": listing_id,
            "payload": __import__("json").dumps(
                {
                    "sellerId": store_id,
                    "productVariantId": body.variant_id,
                    "priceCents": body.price_cents,
                    "stock": body.stock,
                    "condition": body.condition,
                    "requestId": request_id,
                }
            ),
            "meta": __import__("json").dumps({"requestId": request_id, "producer": "marketplace-api"}),
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO platform.domain_events (
              event_type, aggregate_type, aggregate_id, payload, metadata
            ) VALUES (
              'MarketplaceListingPublished', 'listing', :lid,
              CAST(:payload AS jsonb), CAST(:meta AS jsonb)
            )
            """
        ),
        {
            "lid": listing_id,
            "payload": __import__("json").dumps(
                {
                    "actions": ["inventory.upsert", "pricing.refresh", "search.reindex", "analytics.ingest"],
                    "productVariantId": body.variant_id,
                }
            ),
            "meta": __import__("json").dumps({"requestId": request_id}),
        },
    )
    await session.commit()

    return {
        "ok": True,
        "listing_id": listing_id,
        "request_id": request_id,
        "orchestrated": True,
        "note": "Saga steps Inventory/Pricing/Search are consumed asynchronously from domain_events",
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/marketplace/sagas/{saga_id}")
async def get_saga(session: DbSession, saga_id: str) -> dict[str, Any]:
    saga = await session.execute(
        text("SELECT * FROM platform.sagas WHERE id = CAST(:id AS uuid)"),
        {"id": saga_id},
    )
    row = saga.fetchone()
    if not row:
        raise HTTPException(404, detail="saga_not_found")
    steps = await session.execute(
        text(
            """
            SELECT step_name, step_order, status, attempts, error, started_at, finished_at
            FROM platform.saga_steps WHERE saga_id = CAST(:id AS uuid) ORDER BY step_order
            """
        ),
        {"id": saga_id},
    )
    return {
        "saga": dict(row._mapping),
        "steps": [dict(r._mapping) for r in steps.fetchall()],
    }


@router.get("/runtime/judge/marketplace/listings")
async def list_marketplace_listings(
    session: DbSession,
    seller_id: str | None = None,
    status: str = "active",
    limit: int = 50,
) -> dict[str, Any]:
    params: dict[str, Any] = {"lim": limit, "status": status}
    where = "l.status = :status"
    if seller_id:
        where += " AND l.seller_id = CAST(:seller AS uuid)"
        params["seller"] = seller_id
    res = await session.execute(
        text(
            f"""
            SELECT l.id, l.seller_id, l.subject_type, l.product_variant_id,
                   l.catalog_variant_id, l.price_cents, l.condition, l.quantity,
                   l.status, l.published_at
            FROM marketplace.listings l
            WHERE {where}
            ORDER BY l.published_at DESC NULLS LAST
            LIMIT :lim
            """
        ),
        params,
    )
    return {"items": [dict(r._mapping) for r in res.fetchall()]}
