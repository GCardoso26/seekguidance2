"""PDV local products — convenience items for in-store POS only.

Never mixed with product_catalog, knowledge graph, marketplace, or public search.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_pdv import _assert_store_owner
from app.marketplace.shop_store import store_plan_has_feature

LOCAL_CATEGORIES = frozenset(
    {"Snack", "Bebida", "Booster", "Serviço", "Taxa", "Acessório", "Outros"}
)
ITEM_KINDS = frozenset({"goods", "consumable", "service", "fee"})


def _row_to_product(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "store_id": str(row["store_id"]),
        "name": row["name"],
        "sku": row.get("sku"),
        "barcode": row.get("barcode"),
        "category": row["category"],
        "price_cents": int(row["price_cents"]),
        "cost_cents": int(row["cost_cents"]) if row.get("cost_cents") is not None else None,
        "stock": int(row["stock"]) if row.get("stock") is not None else None,
        "minimum_stock": int(row["minimum_stock"]) if row.get("minimum_stock") is not None else None,
        "active": bool(row.get("active", True)),
        "item_kind": row.get("item_kind") or "goods",
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "source": "local",
    }


async def _require_pdv_store(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    store = await _assert_store_owner(session, store_id, owner_id)
    if not store_plan_has_feature(store, "pdv"):
        raise HTTPException(403, "PDV disponível no plano Pro ou superior")
    return store


def _validate_payload(data: dict[str, Any], *, partial: bool = False) -> dict[str, Any]:
    out: dict[str, Any] = {}

    if "name" in data or not partial:
        name = str(data.get("name") or "").strip()
        if not name or len(name) < 1:
            raise HTTPException(400, "Nome obrigatório")
        if len(name) > 200:
            raise HTTPException(400, "Nome muito longo")
        out["name"] = name

    if "category" in data or not partial:
        category = str(data.get("category") or "").strip()
        if category not in LOCAL_CATEGORIES:
            raise HTTPException(400, f"Categoria inválida: {category}")
        out["category"] = category

    if "price_cents" in data or not partial:
        try:
            price = int(data.get("price_cents"))
        except (TypeError, ValueError):
            raise HTTPException(400, "Preço inválido") from None
        if price < 0:
            raise HTTPException(400, "Preço inválido")
        out["price_cents"] = price

    if "cost_cents" in data:
        raw = data.get("cost_cents")
        if raw is None or raw == "":
            out["cost_cents"] = None
        else:
            try:
                cost = int(raw)
            except (TypeError, ValueError):
                raise HTTPException(400, "Custo inválido") from None
            if cost < 0:
                raise HTTPException(400, "Custo inválido")
            out["cost_cents"] = cost
    elif not partial:
        out["cost_cents"] = None

    if "stock" in data:
        raw = data.get("stock")
        if raw is None or raw == "":
            out["stock"] = None
        else:
            try:
                stock = int(raw)
            except (TypeError, ValueError):
                raise HTTPException(400, "Estoque inválido") from None
            if stock < 0:
                raise HTTPException(400, "Estoque inválido")
            out["stock"] = stock
    elif not partial:
        out["stock"] = None

    if "minimum_stock" in data:
        raw = data.get("minimum_stock")
        if raw is None or raw == "":
            out["minimum_stock"] = None
        else:
            try:
                ms = int(raw)
            except (TypeError, ValueError):
                raise HTTPException(400, "Estoque mínimo inválido") from None
            if ms < 0:
                raise HTTPException(400, "Estoque mínimo inválido")
            out["minimum_stock"] = ms
    elif not partial:
        out["minimum_stock"] = None

    if "sku" in data or not partial:
        sku = data.get("sku")
        out["sku"] = str(sku).strip() if sku else None

    if "barcode" in data or not partial:
        barcode = data.get("barcode")
        out["barcode"] = str(barcode).strip() if barcode else None

    if "active" in data or not partial:
        out["active"] = bool(data.get("active", True))

    if "item_kind" in data:
        kind = str(data.get("item_kind") or "goods").strip()
        if kind not in ITEM_KINDS:
            raise HTTPException(400, f"item_kind inválido: {kind}")
        out["item_kind"] = kind
    elif not partial:
        out["item_kind"] = "goods"

    return out


async def list_local_products(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    category: str | None = None,
    active: bool | None = None,
    low_stock: bool = False,
    limit: int = 100,
) -> list[dict[str, Any]]:
    await _require_pdv_store(session, store_id, owner_id)

    clauses = ["store_id = :sid"]
    params: dict[str, Any] = {"sid": store_id, "lim": min(max(limit, 1), 500)}

    if category:
        if category not in LOCAL_CATEGORIES:
            raise HTTPException(400, f"Categoria inválida: {category}")
        clauses.append("category = :cat")
        params["cat"] = category

    if active is not None:
        clauses.append("active = :active")
        params["active"] = active

    if low_stock:
        clauses.append("stock IS NOT NULL AND minimum_stock IS NOT NULL AND stock <= minimum_stock")

    where = " AND ".join(clauses)
    rows = (
        await session.execute(
            text(
                f"""
                SELECT * FROM pdv.local_products
                WHERE {where}
                ORDER BY name ASC
                LIMIT :lim
                """
            ),
            params,
        )
    ).mappings().all()
    return [_row_to_product(dict(r)) for r in rows]


async def create_local_product(
    session: AsyncSession, store_id: str, owner_id: str, data: dict[str, Any]
) -> dict[str, Any]:
    await _require_pdv_store(session, store_id, owner_id)
    payload = _validate_payload(data, partial=False)

    try:
        row = (
            await session.execute(
                text(
                    """
                    INSERT INTO pdv.local_products (
                      store_id, name, sku, barcode, category,
                      price_cents, cost_cents, stock, minimum_stock,
                      active, item_kind
                    ) VALUES (
                      :sid, :name, :sku, :barcode, :category,
                      :price_cents, :cost_cents, :stock, :minimum_stock,
                      :active, :item_kind
                    )
                    RETURNING *
                    """
                ),
                {"sid": store_id, **payload},
            )
        ).mappings().first()
    except Exception as exc:
        await session.rollback()
        msg = str(exc).lower()
        if "uq_pdv_local_products_store_barcode" in msg or "unique" in msg:
            raise HTTPException(400, "Código de barras já cadastrado nesta loja") from exc
        raise

    await session.commit()
    return _row_to_product(dict(row)) if row else {}


async def get_local_product(
    session: AsyncSession, store_id: str, owner_id: str, product_id: str
) -> dict[str, Any]:
    await _require_pdv_store(session, store_id, owner_id)
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM pdv.local_products
                WHERE id = :id AND store_id = :sid
                """
            ),
            {"id": product_id, "sid": store_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Produto local não encontrado")
    return _row_to_product(dict(row))


async def update_local_product(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    product_id: str,
    data: dict[str, Any],
) -> dict[str, Any]:
    await _require_pdv_store(session, store_id, owner_id)
    existing = await get_local_product(session, store_id, owner_id, product_id)
    payload = _validate_payload({**existing, **data}, partial=False)

    try:
        row = (
            await session.execute(
                text(
                    """
                    UPDATE pdv.local_products SET
                      name = :name,
                      sku = :sku,
                      barcode = :barcode,
                      category = :category,
                      price_cents = :price_cents,
                      cost_cents = :cost_cents,
                      stock = :stock,
                      minimum_stock = :minimum_stock,
                      active = :active,
                      item_kind = :item_kind,
                      updated_at = NOW()
                    WHERE id = :id AND store_id = :sid
                    RETURNING *
                    """
                ),
                {"id": product_id, "sid": store_id, **payload},
            )
        ).mappings().first()
    except Exception as exc:
        await session.rollback()
        msg = str(exc).lower()
        if "uq_pdv_local_products_store_barcode" in msg or "unique" in msg:
            raise HTTPException(400, "Código de barras já cadastrado nesta loja") from exc
        raise

    if not row:
        raise HTTPException(404, "Produto local não encontrado")
    await session.commit()
    return _row_to_product(dict(row))


async def delete_local_product(
    session: AsyncSession, store_id: str, owner_id: str, product_id: str
) -> dict[str, Any]:
    """Soft-delete: active = false."""
    await _require_pdv_store(session, store_id, owner_id)
    row = (
        await session.execute(
            text(
                """
                UPDATE pdv.local_products
                SET active = FALSE, updated_at = NOW()
                WHERE id = :id AND store_id = :sid
                RETURNING *
                """
            ),
            {"id": product_id, "sid": store_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Produto local não encontrado")
    await session.commit()
    return _row_to_product(dict(row))


async def search_local_products(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    q: str,
    *,
    limit: int = 20,
    require_owner: bool = True,
) -> list[dict[str, Any]]:
    if require_owner:
        await _require_pdv_store(session, store_id, owner_id)

    term = q.strip()
    if not term:
        return []

    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM pdv.local_products
                WHERE store_id = :sid AND active
                  AND (
                    name ILIKE :like
                    OR sku ILIKE :like
                    OR barcode ILIKE :like
                    OR lower(coalesce(sku, '')) = lower(:exact)
                    OR lower(coalesce(barcode, '')) = lower(:exact)
                  )
                ORDER BY
                  CASE
                    WHEN lower(coalesce(barcode, '')) = lower(:exact) THEN 0
                    WHEN lower(coalesce(sku, '')) = lower(:exact) THEN 1
                    ELSE 2
                  END,
                  name
                LIMIT :lim
                """
            ),
            {
                "sid": store_id,
                "like": f"%{term}%",
                "exact": term,
                "lim": min(max(limit, 1), 50),
            },
        )
    ).mappings().all()
    return [_row_to_product(dict(r)) for r in rows]


def stock_is_infinite(stock: Any) -> bool:
    return stock is None


def can_sell_quantity(stock: Any, qty: int) -> bool:
    if stock_is_infinite(stock):
        return True
    return int(stock) >= qty


async def reports_local_products(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> dict[str, Any]:
    await _require_pdv_store(session, store_id, owner_id)

    clauses = ["store_id = :sid"]
    params: dict[str, Any] = {"sid": store_id}
    if date_from is not None:
        clauses.append("created_at >= :df")
        params["df"] = date_from
    if date_to is not None:
        clauses.append("created_at <= :dt")
        params["dt"] = date_to

    where = " AND ".join(clauses)
    sales = (
        await session.execute(
            text(
                f"""
                SELECT items, total_cents, created_at
                FROM tcg_judge.pdv_sales
                WHERE {where}
                """
            ),
            params,
        )
    ).mappings().all()

    revenue_local = 0
    revenue_official = 0
    profit_local = 0
    by_product: dict[str, dict[str, Any]] = {}

    for sale in sales:
        items = sale.get("items")
        if isinstance(items, str):
            try:
                items = json.loads(items)
            except json.JSONDecodeError:
                items = []
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            qty = max(1, int(item.get("quantity") or 1))
            price = max(0, int(item.get("price_cents") or 0))
            line = int(item.get("line_total_cents") or price * qty)
            source = str(item.get("source") or ("local" if item.get("local_product_id") else "official"))
            if source == "local":
                revenue_local += line
                cost = item.get("cost_cents")
                if cost is not None:
                    profit_local += line - (int(cost) * qty)
                pid = str(item.get("local_product_id") or item.get("product_id") or item.get("name") or "unknown")
                bucket = by_product.setdefault(
                    pid,
                    {
                        "local_product_id": item.get("local_product_id"),
                        "name": item.get("name") or "Item",
                        "quantity": 0,
                        "revenue_cents": 0,
                        "profit_cents": 0,
                    },
                )
                bucket["quantity"] += qty
                bucket["revenue_cents"] += line
                if cost is not None:
                    bucket["profit_cents"] += line - (int(cost) * qty)
            else:
                revenue_official += line

    top = sorted(by_product.values(), key=lambda x: x["revenue_cents"], reverse=True)[:20]

    low_stock_rows = (
        await session.execute(
            text(
                """
                SELECT * FROM pdv.local_products
                WHERE store_id = :sid AND active
                  AND stock IS NOT NULL
                  AND minimum_stock IS NOT NULL
                  AND stock <= minimum_stock
                ORDER BY stock ASC, name
                LIMIT 50
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    margin_pct = (
        round((profit_local / revenue_local) * 100, 2) if revenue_local > 0 and profit_local else 0.0
    )

    return {
        "revenue_local_cents": revenue_local,
        "revenue_official_cents": revenue_official,
        "profit_local_cents": profit_local,
        "margin_pct": margin_pct,
        "top_products": top,
        "low_stock": [_row_to_product(dict(r)) for r in low_stock_rows],
    }
