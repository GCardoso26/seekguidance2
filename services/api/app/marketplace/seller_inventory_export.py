"""Inventory export CSV/JSON (Application Layer)."""

from __future__ import annotations

import csv
import io
import json
from typing import Any, Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_inventory_health import enrich_items_with_health
from app.marketplace.seller_inventory_search import Kind, Source, search_inventory

ExportFormat = Literal["csv", "json"]


async def export_inventory(
    session: AsyncSession,
    owner_id: str,
    *,
    fmt: ExportFormat = "csv",
    source: Source = "my_catalog",
    kind: Kind = "products",
    game: str = "mtg",
    q: str | None = None,
    ids: list[str] | None = None,
) -> dict[str, Any]:
    result = await search_inventory(
        session,
        owner_id,
        source=source,
        kind=kind,
        game=game,
        q=q,
        page=1,
        limit=48,
    )
    items = enrich_items_with_health(list(result.get("items") or []))
    if ids:
        idset = set(ids)
        items = [
            i
            for i in items
            if str(i.get("id")) in idset
            or str(i.get("listing_id")) in idset
            or str(i.get("product_id")) in idset
        ]

    rows = [
        {
            "id": i.get("id"),
            "kind": i.get("kind"),
            "title": i.get("title"),
            "quantity": i.get("quantity"),
            "price_cents": i.get("price_cents"),
            "sku": i.get("sku") or "",
            "category": i.get("category") or "",
            "condition": i.get("condition") or "",
            "language": i.get("language") or "",
            "source": i.get("source") or source,
            "status": i.get("status") or "active",
            "health_score": (i.get("health") or {}).get("score"),
            "set_code": i.get("set_code") or "",
        }
        for i in items
    ]

    if fmt == "json":
        return {"format": "json", "filename": "inventory-export.json", "content": json.dumps(rows, ensure_ascii=False)}

    buf = io.StringIO()
    writer = csv.DictWriter(
        buf,
        fieldnames=[
            "id",
            "kind",
            "title",
            "quantity",
            "price_cents",
            "sku",
            "category",
            "condition",
            "language",
            "source",
            "status",
            "health_score",
            "set_code",
        ],
    )
    writer.writeheader()
    writer.writerows(rows)
    return {"format": "csv", "filename": "inventory-export.csv", "content": buf.getvalue()}
