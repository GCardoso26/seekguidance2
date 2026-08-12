"""Agregações do painel do vendedor (loja + listagens)."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import card_listings as card_listings_svc
from app.marketplace import seller_dashboard_overview_cache as overview_cache
from app.marketplace import seller_fulfillment as seller_ff
from app.marketplace import shop_orders

Period = Literal["7d", "30d", "90d", "1y", "all"]

_PERIOD_INTERVAL = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    "1y": "365 days",
    "all": None,
}

_REVENUE_FILTER = "o.status IN ('paid', 'processing', 'shipped', 'delivered')"


async def resolve_owner_store(session: AsyncSession, owner_id: str) -> dict[str, Any]:
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
        raise HTTPException(404, "Loja não encontrada")
    return dict(row)


async def _count_pending_payment(session: AsyncSession, store_id: str) -> int:
    row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid AND status = 'pending'
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    return int(row["cnt"] if row else 0)


async def _count_to_separate(session: AsyncSession, store_id: str) -> int:
    row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                  AND status IN ('paid', 'processing')
                  AND shipped_at IS NULL
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    return int(row["cnt"] if row else 0)


async def _count_shipped_today(session: AsyncSession, store_id: str) -> int:
    row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                  AND status = 'shipped'
                  AND shipped_at >= CURRENT_DATE
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    return int(row["cnt"] if row else 0)


async def _revenue_today(session: AsyncSession, store_id: str) -> dict[str, int]:
    row = (
        await session.execute(
            text(
                """
                SELECT
                  COALESCE(SUM(store_receives_cents), 0) AS revenue_cents,
                  COALESCE(SUM(store_receives_cents) FILTER (
                    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
                      AND created_at < CURRENT_DATE
                  ), 0) AS yesterday_cents
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                  AND status IN ('paid', 'processing', 'shipped', 'delivered')
                  AND created_at >= CURRENT_DATE
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    if not row:
        return {"revenue_cents": 0, "yesterday_cents": 0}
    return {
        "revenue_cents": int(row["revenue_cents"] or 0),
        "yesterday_cents": int(row["yesterday_cents"] or 0),
    }


async def _recent_orders_overview(session: AsyncSession, store_id: str, *, limit: int = 5) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT o.id, o.status, o.total_cents, o.created_at, o.payment_method,
                       p.display_name AS customer_name
                FROM tcg_judge.shop_orders o
                LEFT JOIN tcg_judge.player_profiles p ON p.id = o.buyer_id
                WHERE o.store_id = :sid
                ORDER BY o.created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def _low_stock_items(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    threshold: int = 3,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT l.id, cc.name AS title, l.quantity AS stock,
                       cc.image_url, cc.game_code AS game_name, 'listing' AS item_type
                FROM tcg_judge.card_listings l
                JOIN tcg_judge.card_catalog cc ON cc.id = l.card_id
                WHERE l.store_id = :sid AND l.status = 'active' AND l.quantity < :thr
                UNION ALL
                SELECT p.id, p.name AS title, p.stock,
                       COALESCE(p.images[1], NULL) AS image_url,
                       p.category AS game_name, 'product' AS item_type
                FROM tcg_judge.store_products p
                WHERE p.store_id = :sid AND p.is_active AND p.stock < :thr
                ORDER BY stock ASC
                LIMIT 10
                """
            ),
            {"sid": store_id, "thr": threshold, "uid": owner_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def _count_open_tickets(session: AsyncSession, store_id: str) -> int:
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*) AS cnt
                    FROM tcg_judge.support_tickets
                    WHERE store_id = :sid
                      AND status IN ('open', 'in_progress', 'waiting_customer')
                    """
                ),
                {"sid": store_id},
            )
        ).mappings().first()
        return int(row["cnt"] if row else 0)
    except Exception:
        return 0


async def _reputation_overview(session: AsyncSession, store_id: str) -> dict[str, Any]:
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT trust_score, seller_level, badges, anti_fraud_flags,
                           sla_violations, chargebacks_open
                    FROM tcg_judge.seller_scores
                    WHERE store_id = CAST(:sid AS uuid)
                    """
                ),
                {"sid": store_id},
            )
        ).mappings().first()
        if not row:
            return {
                "trust_score": 75.0,
                "seller_level": "new",
                "badges": ["new_seller"],
                "alerts_count": 0,
            }
        alerts = int(row.get("sla_violations") or 0) + int(row.get("chargebacks_open") or 0)
        flags = row.get("anti_fraud_flags") or []
        if flags:
            alerts += len(flags)
        return {
            "trust_score": float(row["trust_score"]),
            "seller_level": str(row["seller_level"]),
            "badges": list(row.get("badges") or []),
            "alerts_count": alerts,
        }
    except Exception:
        return {"trust_score": 75.0, "seller_level": "new", "badges": [], "alerts_count": 0}


async def get_dashboard_overview(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    cached = overview_cache.get_dashboard_overview_cache(store_id)
    if cached:
        return cached

    (
        pending_payment,
        to_separate,
        shipped_today,
        revenue,
        recent_orders,
        low_stock,
        open_tickets,
        fulfillment_sla,
        reputation_summary,
    ) = await asyncio.gather(
        _count_pending_payment(session, store_id),
        _count_to_separate(session, store_id),
        _count_shipped_today(session, store_id),
        _revenue_today(session, store_id),
        _recent_orders_overview(session, store_id),
        _low_stock_items(session, store_id, owner_id),
        _count_open_tickets(session, store_id),
        seller_ff.get_fulfillment_sla_metrics(session, store_id),
        _reputation_overview(session, store_id),
    )

    revenue_cents = revenue["revenue_cents"]
    yesterday_cents = revenue["yesterday_cents"]
    delta_cents = revenue_cents - yesterday_cents

    listings_cnt = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS c
                FROM tcg_judge.card_listings
                WHERE seller_id = :uid AND status = 'active'
                """
            ),
            {"uid": owner_id},
        )
    ).mappings().first()
    active_listings = int(listings_cnt["c"] if listings_cnt else 0)

    from app.stores.trust_tiers import resolve_trust_tier, trust_tier_payload

    trust_tier = resolve_trust_tier(
        store,
        orders_completed=0,
        active_listings=active_listings,
        review_avg=float(store.get("average_rating") or 0),
        review_count=int(store.get("review_count") or 0),
        trust_score=float((reputation_summary or {}).get("trust_score") or 0) or None,
    )
    try:
        from app.reputation.reputation_engine import get_seller_reputation_dashboard

        rep_full = await get_seller_reputation_dashboard(session, store_id)
        oc = int(rep_full.get("orders_completed") or 0)
        cancel_rate = None
        ship_on_time = None
        try:
            cancel_row = (
                await session.execute(
                    text(
                        """
                        SELECT
                          COUNT(*)::int AS total,
                          COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
                        FROM tcg_judge.shop_orders
                        WHERE store_id = :sid
                        """
                    ),
                    {"sid": store_id},
                )
            ).mappings().first()
            total_orders = int(cancel_row["total"] if cancel_row else 0)
            cancelled = int(cancel_row["cancelled"] if cancel_row else 0)
            if total_orders:
                cancel_rate = cancelled / total_orders
        except Exception:
            pass
        sla_detail = rep_full.get("sla_detail") or {}
        if isinstance(sla_detail, dict):
            raw_ship = sla_detail.get("on_time_rate") or sla_detail.get("ship_on_time_rate")
            if raw_ship is not None:
                ship_on_time = float(raw_ship)
        trust_tier = resolve_trust_tier(
            store,
            orders_completed=oc,
            active_listings=active_listings,
            review_avg=float(rep_full.get("review_avg") or store.get("average_rating") or 0),
            review_count=int(rep_full.get("review_count") or store.get("review_count") or 0),
            cancel_rate=cancel_rate,
            ship_on_time_rate=ship_on_time,
            trust_score=float(rep_full.get("trust_score") or 0) or None,
        )
        if trust_tier and trust_tier != store.get("trust_tier"):
            await session.execute(
                text(
                    "UPDATE tcg_judge.stores SET trust_tier = :t, updated_at = NOW() WHERE id = :id"
                ),
                {"t": trust_tier, "id": store_id},
            )
            await session.commit()
    except Exception:
        pass

    payments_ok = bool(store.get("pix_key") or (store.get("stripe_account_id") and store.get("stripe_onboarding_complete")))
    shipping_ok = bool(store.get("postal_code") or store.get("city"))
    acc_status = str(store.get("accreditation_status") or "")
    show_onboarding = acc_status == "approved" and (
        active_listings == 0 or not payments_ok or not shipping_ok
    )

    result = {
        "metrics": {
            "pending_payment": pending_payment,
            "to_separate": to_separate,
            "shipped_today": shipped_today,
            "revenue_today_cents": revenue_cents,
            "revenue_delta_cents": delta_cents,
            "active_listings": active_listings,
        },
        "fulfillment_sla": fulfillment_sla,
        "reputation": reputation_summary,
        "trust_tier": trust_tier_payload(trust_tier),
        "stock_sync": {
            "last_sync_at": str(store["last_inventory_sync_at"])
            if store.get("last_inventory_sync_at")
            else None,
            "active_listings": active_listings,
            "low_stock_count": len(low_stock) if isinstance(low_stock, list) else 0,
            "import_href": "/vendedor/painel/estoque",
        },
        "post_approval_onboarding": {
            "visible": show_onboarding,
            "accreditation_status": acc_status,
            "steps": [
                {
                    "id": "catalog",
                    "label": "Conectar catálogo (CSV ou expansão)",
                    "done": active_listings > 0,
                    "href": "/vendedor/painel/estoque",
                },
                {
                    "id": "payments",
                    "label": "Configurar pagamentos",
                    "done": payments_ok,
                    "href": "/vendedor/painel/configuracoes/pagamentos",
                },
                {
                    "id": "shipping",
                    "label": "Configurar envio",
                    "done": shipping_ok,
                    "href": "/vendedor/painel/configuracoes",
                },
                {
                    "id": "first_offer",
                    "label": "Publicar primeiras ofertas",
                    "done": active_listings > 0,
                    "href": "/vendedor/painel/catalogo/cartas?action=new",
                },
            ],
        },
        "recent_orders": recent_orders,
        "low_stock": low_stock,
        "open_tickets": open_tickets,
        "generated_at": datetime.now(UTC).isoformat(),
    }

    overview_cache.set_dashboard_overview_cache(store_id, result)
    return result


async def get_dashboard(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    base = await shop_orders.store_dashboard_enhanced(session, store_id, owner_id)

    pending = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (WHERE status = 'paid') AS pending_shipments,
                  COUNT(*) FILTER (WHERE status = 'disputed') AS open_disputes
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    low_stock = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND is_active AND stock <= 3
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    listings_count = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM tcg_judge.card_listings
                WHERE seller_id = :uid AND status = 'active'
                """
            ),
            {"uid": owner_id},
        )
    ).mappings().first()

    recent = await shop_orders.list_store_orders(session, store_id, owner_id, limit=5)

    stats = base.get("stats") or {}
    revenue = base.get("revenue") or {}
    return {
        "store": base.get("store"),
        "kpis": {
            "revenue": {
                "current": int(revenue.get("month_cents") or 0),
                "previous": 0,
            },
            "sales_count": int(stats.get("paid_orders") or 0),
            "active_listings": int(listings_count["cnt"] if listings_count else 0)
            + int(stats.get("active_products") or 0),
        },
        "sales_chart": base.get("sales_chart") or [],
        "recent_orders": recent.get("orders") or [],
        "pending": {
            "shipments": int(pending["pending_shipments"] if pending else 0),
            "disputes": int(pending["open_disputes"] if pending else 0),
            "low_stock": int(low_stock["cnt"] if low_stock else 0),
        },
        "top_products": base.get("top_products") or [],
    }


async def get_store_order(session: AsyncSession, order_id: str, owner_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT o.*,
                  (SELECT json_agg(i.*) FROM tcg_judge.shop_order_items i WHERE i.order_id = o.id) AS items,
                  s.name AS store_name
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE o.id = :id AND s.owner_id = :oid
                """
            ),
            {"id": order_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Pedido não encontrado")
    return dict(row)


async def get_seller_stats(session: AsyncSession, owner_id: str, period: Period = "30d") -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    interval = _PERIOD_INTERVAL.get(period)
    time_filter = "TRUE" if not interval else f"o.created_at >= NOW() - INTERVAL '{interval}'"

    summary = (
        await session.execute(
            text(
                f"""
                SELECT
                  COALESCE(SUM(o.store_receives_cents) FILTER (WHERE {_REVENUE_FILTER}), 0) AS revenue_cents,
                  COUNT(*) FILTER (WHERE {_REVENUE_FILTER}) AS sales_count,
                  COUNT(DISTINCT o.buyer_id) FILTER (WHERE {_REVENUE_FILTER}) AS unique_buyers
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid AND {time_filter}
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    chart = (
        await session.execute(
            text(
                f"""
                SELECT DATE(o.created_at) AS date,
                  COALESCE(SUM(o.store_receives_cents) FILTER (WHERE {_REVENUE_FILTER}), 0) AS revenue_cents,
                  COUNT(*) FILTER (WHERE {_REVENUE_FILTER}) AS count
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid AND {time_filter}
                GROUP BY DATE(o.created_at)
                ORDER BY date
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    top_cards = (
        await session.execute(
            text(
                f"""
                SELECT i.product_name AS name,
                  SUM(i.quantity) AS count,
                  SUM(i.unit_price_cents * i.quantity) AS revenue_cents
                FROM tcg_judge.shop_order_items i
                JOIN tcg_judge.shop_orders o ON o.id = i.order_id
                WHERE o.store_id = :sid AND {_REVENUE_FILTER} AND {time_filter}
                GROUP BY i.product_name
                ORDER BY count DESC
                LIMIT 10
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    sales_count = int(summary["sales_count"] if summary else 0)
    revenue_cents = int(summary["revenue_cents"] if summary else 0)
    aov = round(revenue_cents / sales_count / 100, 2) if sales_count else 0

    return {
        "revenue": {
            "total_cents": revenue_cents,
            "chart": [dict(r) for r in chart],
        },
        "sales_count": sales_count,
        "unique_buyers": int(summary["unique_buyers"] if summary else 0),
        "top_cards": [dict(r) for r in top_cards],
        "sales_by_game": [],
        "average_order_value": aov,
    }


async def get_seller_settings(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    base = await shop_orders.store_dashboard_stats(session, str(store["id"]), owner_id)
    return base


async def update_seller_settings(
    session: AsyncSession,
    owner_id: str,
    *,
    name: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    sets: list[str] = []
    params: dict[str, Any] = {"id": store_id, "oid": owner_id}
    if name is not None:
        sets.append("name = :name")
        params["name"] = name
    if description is not None:
        sets.append("description = :description")
        params["description"] = description
    if not sets:
        return {"store": store}

    row = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.stores
                SET {", ".join(sets)}, updated_at = NOW()
                WHERE id = :id AND owner_id = :oid
                RETURNING *
                """
            ),
            params,
        )
    ).mappings().first()
    await session.commit()
    return {"store": dict(row) if row else store}


async def list_seller_listings(
    session: AsyncSession,
    owner_id: str,
    *,
    status: str | None = None,
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    listings = await card_listings_svc.list_my_listings(session, owner_id, status=status)
    start = (max(1, page) - 1) * limit
    end = start + limit
    sliced = listings[start:end]
    return {"listings": sliced, "total": len(listings), "page": page, "limit": limit}
