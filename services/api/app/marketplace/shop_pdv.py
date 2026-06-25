"""PDV — vendas presenciais no balcão."""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_store import store_plan_has_feature


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


async def create_pdv_sale(
    session: AsyncSession,
    store_id: str,
    seller_id: str,
    *,
    items: list[dict[str, Any]],
    payment_method: str = "cash",
    notes: str | None = None,
) -> dict[str, Any]:
    store = await _assert_store_owner(session, store_id, seller_id)
    if not store_plan_has_feature(store, "pdv"):
        raise HTTPException(403, "PDV disponível no plano Pro ou superior")
    if payment_method not in {"cash", "pix", "card"}:
        raise HTTPException(400, "Método de pagamento inválido")
    if not items:
        raise HTTPException(400, "Carrinho vazio")

    total = 0
    normalized: list[dict[str, Any]] = []
    for item in items:
        qty = max(1, int(item.get("quantity") or 1))
        price = max(0, int(item.get("price_cents") or 0))
        line_total = price * qty
        total += line_total
        product_id = item.get("product_id")
        if product_id:
            prod = (
                await session.execute(
                    text(
                        """
                        SELECT id, stock, name FROM tcg_judge.store_products
                        WHERE id = :id AND store_id = :sid
                        """
                    ),
                    {"id": product_id, "sid": store_id},
                )
            ).mappings().first()
            if not prod:
                raise HTTPException(400, f"Produto não encontrado: {product_id}")
            if int(prod["stock"]) < qty:
                raise HTTPException(400, f"Estoque insuficiente: {prod['name']}")
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_products
                    SET stock = stock - :qty, updated_at = NOW()
                    WHERE id = :id
                    """
                ),
                {"qty": qty, "id": product_id},
            )
        normalized.append(
            {
                "product_id": product_id,
                "name": item.get("name") or "Item",
                "quantity": qty,
                "price_cents": price,
                "line_total_cents": line_total,
            }
        )

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.pdv_sales (store_id, seller_id, items, total_cents, payment_method, notes)
                VALUES (:sid, :seller, CAST(:items AS jsonb), :total, :pm, :notes)
                RETURNING *
                """
            ),
            {
                "sid": store_id,
                "seller": seller_id,
                "items": json.dumps(normalized),
                "total": total,
                "pm": payment_method,
                "notes": notes,
            },
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def list_pdv_sales(
    session: AsyncSession, store_id: str, owner_id: str, *, limit: int = 30
) -> list[dict[str, Any]]:
    store = await _assert_store_owner(session, store_id, owner_id)
    if not store_plan_has_feature(store, "pdv"):
        raise HTTPException(403, "PDV disponível no plano Pro ou superior")

    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.pdv_sales
                WHERE store_id = :sid
                ORDER BY created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": min(limit, 100)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def search_pdv_products(
    session: AsyncSession, store_id: str, owner_id: str, q: str, *, limit: int = 20
) -> list[dict[str, Any]]:
    await _assert_store_owner(session, store_id, owner_id)
    rows = (
        await session.execute(
            text(
                """
                SELECT id, name, price_cents, stock, sku, category, images
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND is_active
                  AND (name ILIKE :q OR sku ILIKE :q)
                ORDER BY name
                LIMIT :lim
                """
            ),
            {"sid": store_id, "q": f"%{q.strip()}%", "lim": min(limit, 50)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
