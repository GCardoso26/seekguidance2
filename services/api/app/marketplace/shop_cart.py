"""Carrinho de compras do marketplace."""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_cart(session: AsyncSession, user_id: str) -> dict[str, Any]:
    from app.players.store import ensure_player_profile

    await ensure_player_profile(session, user_id)
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.shopping_carts WHERE user_id = :uid"),
            {"uid": user_id},
        )
    ).mappings().first()
    if not row:
        row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shopping_carts (user_id, items, total_cents)
                    VALUES (:uid, '[]'::jsonb, 0)
                    RETURNING *
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        await session.commit()
    return dict(row) if row else {"items": [], "total_cents": 0}


async def _save_cart(session: AsyncSession, cart_id: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    total = sum(int(i.get("price_cents", 0)) * int(i.get("quantity", 0)) for i in items)
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shopping_carts
                SET items = :items::jsonb, total_cents = :total, updated_at = NOW()
                WHERE id = :id
                RETURNING *
                """
            ),
            {"id": cart_id, "items": json.dumps(items), "total": total},
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def add_to_cart(
    session: AsyncSession,
    user_id: str,
    product_id: str,
    quantity: int = 1,
) -> dict[str, Any]:
    if quantity < 1:
        raise HTTPException(400, "Quantidade inválida")

    product = (
        await session.execute(
            text(
                """
                SELECT p.*, s.shop_enabled
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE p.id = :id AND p.is_active = true
                """
            ),
            {"id": product_id},
        )
    ).mappings().first()
    if not product or not product["shop_enabled"]:
        raise HTTPException(404, "Produto não encontrado")
    if int(product["stock"]) < quantity:
        raise HTTPException(400, "Estoque insuficiente")

    cart = await get_cart(session, user_id)
    items: list[dict[str, Any]] = list(cart.get("items") or [])
    images = product.get("images") or []
    image = images[0] if images else None

    found = False
    for item in items:
        if item.get("product_id") == product_id:
            new_qty = int(item.get("quantity", 0)) + quantity
            if new_qty > int(product["stock"]):
                raise HTTPException(400, "Estoque insuficiente")
            item["quantity"] = new_qty
            found = True
            break

    if not found:
        items.append(
            {
                "product_id": product_id,
                "store_id": str(product["store_id"]),
                "name": product["name"],
                "image": image,
                "price_cents": int(product["price_cents"]),
                "quantity": quantity,
            }
        )

    return await _save_cart(session, str(cart["id"]), items)


async def update_cart_item(
    session: AsyncSession, user_id: str, product_id: str, quantity: int
) -> dict[str, Any]:
    cart = await get_cart(session, user_id)
    items: list[dict[str, Any]] = list(cart.get("items") or [])

    if quantity <= 0:
        items = [i for i in items if i.get("product_id") != product_id]
        return await _save_cart(session, str(cart["id"]), items)

    product = (
        await session.execute(
            text("SELECT stock FROM tcg_judge.store_products WHERE id = :id"),
            {"id": product_id},
        )
    ).mappings().first()
    if not product or int(product["stock"]) < quantity:
        raise HTTPException(400, "Estoque insuficiente")

    updated = False
    for item in items:
        if item.get("product_id") == product_id:
            item["quantity"] = quantity
            updated = True
            break
    if not updated:
        raise HTTPException(404, "Item não está no carrinho")

    return await _save_cart(session, str(cart["id"]), items)


async def remove_from_cart(session: AsyncSession, user_id: str, product_id: str) -> dict[str, Any]:
    return await update_cart_item(session, user_id, product_id, 0)


async def clear_cart(session: AsyncSession, user_id: str) -> None:
    cart = await get_cart(session, user_id)
    await _save_cart(session, str(cart["id"]), [])
