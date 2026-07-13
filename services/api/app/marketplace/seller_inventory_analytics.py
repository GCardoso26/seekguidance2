"""Inventory Analytics KPIs (Application Layer)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_inventory_dashboard import get_inventory_dashboard
from app.marketplace.seller_inventory_health import average_health, enrich_items_with_health
from app.marketplace.seller_inventory_search import search_inventory


async def get_inventory_analytics(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    dash = await get_inventory_dashboard(session, owner_id)
    store_id = dash["store_id"]

    # Sample my_catalog products + cards for health average
    products = await search_inventory(
        session, owner_id, source="my_catalog", kind="products", page=1, limit=48
    )
    cards = await search_inventory(
        session, owner_id, source="my_catalog", kind="cards", game="mtg", page=1, limit=48
    )
    sample = enrich_items_with_health([*(products.get("items") or []), *(cards.get("items") or [])])

    trend = (
        await session.execute(
            text(
                """
                SELECT DATE(o.created_at) AS day,
                       COALESCE(SUM(i.quantity), 0)::int AS units
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.shop_order_items i ON i.order_id = o.id
                WHERE o.store_id = :sid
                  AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
                  AND o.created_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(o.created_at)
                ORDER BY day
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    totals = dash.get("totals") or {}
    out_of_stock_action = next((a for a in dash["actions"] if a["id"] == "out_of_stock"), None)
    rupture = int((out_of_stock_action or {}).get("count") or 0)

    return {
        "kpis": {
            "active_skus": int(totals.get("active_products") or 0) + int(totals.get("active_listings") or 0),
            "total_units": int(totals.get("total_units") or 0),
            "value_cents": int(totals.get("value_cents") or 0),
            "rupture_count": rupture,
            "health_avg": average_health(sample),
            "turnover_note": "Giro/ABC completo na próxima iteração",
            "idle_note": "Tempo parado na próxima iteração",
        },
        "trend_7d": [dict(r) for r in trend],
        "suggestions": _suggestions(dash, average_health(sample)),
    }


def _suggestions(dash: dict[str, Any], health_avg: float) -> list[dict[str, str]]:
    tips: list[dict[str, str]] = []
    for action in dash.get("actions") or []:
        count = int(action.get("count") or 0)
        if count <= 0:
            continue
        if action["id"] == "missing_image":
            tips.append(
                {
                    "id": "fix_images",
                    "text": f"{count} anúncios sem imagem. Adicione fotos para melhorar conversão.",
                    "filter": "missing_image",
                }
            )
        elif action["id"] == "out_of_stock":
            tips.append(
                {
                    "id": "restock",
                    "text": f"{count} produtos sem estoque. Considere reposição.",
                    "filter": "without_stock",
                }
            )
        elif action["id"] == "low_stock":
            tips.append(
                {
                    "id": "low_stock",
                    "text": f"{count} produtos abaixo do mínimo. Planeje reposição.",
                    "filter": "low_stock",
                }
            )
        elif action["id"] == "unpublished":
            tips.append(
                {
                    "id": "publish",
                    "text": f"{count} itens não publicados. Revise e publique.",
                    "filter": "inactive",
                }
            )
    if health_avg and health_avg < 70:
        tips.append(
            {
                "id": "health",
                "text": f"Saúde média do inventário em {health_avg}/100. Priorize imagem e preço.",
                "filter": "health_critical",
            }
        )
    if not tips:
        tips.append(
            {
                "id": "ok",
                "text": "Inventário saudável. Nenhuma ação urgente sugerida.",
                "filter": "",
            }
        )
    return tips[:8]
