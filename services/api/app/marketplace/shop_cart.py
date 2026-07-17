"""Carrinho de compras do marketplace."""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_store import store_is_sellable


def _parse_cart_items(raw: Any) -> list[dict[str, Any]]:
    if raw is None:
        return []
    if isinstance(raw, str):
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    if isinstance(raw, list):
        return list(raw)
    return []


def _assert_product_matches_expected_card(
    product: dict[str, Any],
    expected_card_id: str | None,
) -> None:
    if not expected_card_id:
        return
    catalog_card_id = product.get("catalog_card_id")
    if catalog_card_id is None:
        return
    if str(catalog_card_id) != str(expected_card_id):
        raise HTTPException(
            409,
            "Este produto não corresponde à carta da página. Atualize a oferta e tente de novo.",
        )


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
        try:
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shopping_carts (user_id, items, total_cents)
                    VALUES (:uid, '[]'::jsonb, 0)
                    ON CONFLICT (user_id) DO NOTHING
                    """
                ),
                {"uid": user_id},
            )
            await session.commit()
        except IntegrityError:
            await session.rollback()
        row = (
            await session.execute(
                text("SELECT * FROM tcg_judge.shopping_carts WHERE user_id = :uid"),
                {"uid": user_id},
            )
        ).mappings().first()
    cart = dict(row) if row else {"items": [], "total_cents": 0}
    cart["items"] = _parse_cart_items(cart.get("items"))
    return cart


async def _save_cart(session: AsyncSession, cart_id: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    total = sum(int(i.get("price_cents", 0)) * int(i.get("quantity", 0)) for i in items)
    stmt = text(
        """
        UPDATE tcg_judge.shopping_carts
        SET items = :items, total_cents = :total, updated_at = NOW()
        WHERE id = :id
        RETURNING *
        """
    ).bindparams(bindparam("items", type_=JSONB))
    row = (
        await session.execute(
            stmt,
            {"id": cart_id, "items": items, "total": total},
        )
    ).mappings().first()
    await session.commit()
    cart = dict(row) if row else {}
    if cart:
        cart["items"] = _parse_cart_items(cart.get("items"))
    return cart


async def _load_active_product(session: AsyncSession, product_id: str) -> dict[str, Any] | None:
    """Carrega produto ativo + flags da loja (sem filtrar sellable — mensagem fica explícita)."""
    return (
        await session.execute(
            text(
                """
                SELECT p.*,
                       s.shop_enabled, s.pix_key, s.stripe_account_id,
                       s.stripe_onboarding_complete, s.name AS store_name
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE p.id = CAST(:id AS uuid) AND p.is_active = true
                """
            ),
            {"id": product_id},
        )
    ).mappings().first()


async def _resolve_product_id_for_cart(
    session: AsyncSession,
    raw_id: str,
    *,
    expected_card_id: str | None = None,
) -> str:
    """Aceita store_products.id ou card_listings.id."""
    product = await _load_active_product(session, raw_id)
    if product:
        _assert_product_matches_expected_card(dict(product), expected_card_id)
        return str(product["id"])

    listing = (
        await session.execute(
            text(
                """
                SELECT store_product_id, store_id, card_id
                FROM tcg_judge.card_listings
                WHERE id = CAST(:id AS uuid) AND status = 'active'
                """
            ),
            {"id": raw_id},
        )
    ).mappings().first()
    if not listing:
        raise HTTPException(404, "Produto não encontrado")

    listing_card_id = str(listing["card_id"])
    if expected_card_id and str(expected_card_id) != listing_card_id:
        raise HTTPException(
            409,
            "Esta oferta não corresponde à carta da página. Atualize e tente de novo.",
        )

    if listing.get("store_product_id"):
        product = await _load_active_product(session, str(listing["store_product_id"]))
        if not product:
            raise HTTPException(404, "Produto não encontrado")
        _assert_product_matches_expected_card(dict(product), listing_card_id)
        _assert_product_matches_expected_card(dict(product), expected_card_id)
        return str(product["id"])

    linked = (
        await session.execute(
            text(
                """
                SELECT id
                FROM tcg_judge.store_products
                WHERE store_id = :sid
                  AND catalog_card_id = :cid
                  AND is_active = true
                ORDER BY updated_at DESC NULLS LAST, created_at DESC
                LIMIT 1
                """
            ),
            {"sid": listing["store_id"], "cid": listing["card_id"]},
        )
    ).mappings().first()
    if linked:
        return str(linked["id"])

    raise HTTPException(
        404,
        "Esta oferta não está vinculada a um produto da loja. Peça ao vendedor para republicar.",
    )


async def add_to_cart(
    session: AsyncSession,
    user_id: str,
    product_id: str,
    quantity: int = 1,
    *,
    expected_card_id: str | None = None,
) -> dict[str, Any]:
    if quantity < 1:
        raise HTTPException(400, "Quantidade inválida")

    resolved_product_id = await _resolve_product_id_for_cart(
        session,
        product_id,
        expected_card_id=expected_card_id,
    )
    product = await _load_active_product(session, resolved_product_id)
    if not product:
        raise HTTPException(404, "Produto não encontrado")

    _assert_product_matches_expected_card(dict(product), expected_card_id)

    store_row = dict(product)
    if not store_is_sellable(store_row):
        raise HTTPException(
            400,
            f"A loja '{product.get('store_name') or 'do vendedor'}' ainda não habilitou vendas (PIX ou Stripe).",
        )

    available = int(product["stock"]) - int(product.get("reserved_stock") or 0)
    if available < quantity:
        raise HTTPException(400, "Estoque insuficiente")

    cart = await get_cart(session, user_id)
    items = _parse_cart_items(cart.get("items"))
    images = product.get("images") or []
    if not isinstance(images, list):
        images = []
    image = images[0] if images else None

    found = False
    for item in items:
        if item.get("product_id") == resolved_product_id:
            new_qty = int(item.get("quantity", 0)) + quantity
            if new_qty > available:
                raise HTTPException(400, "Estoque insuficiente")
            item["quantity"] = new_qty
            found = True
            break

    if not found:
        items.append(
            {
                "product_id": resolved_product_id,
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
    items = _parse_cart_items(cart.get("items"))

    if quantity <= 0:
        items = [i for i in items if i.get("product_id") != product_id]
        return await _save_cart(session, str(cart["id"]), items)

    product = (
        await session.execute(
            text(
                """
                SELECT stock, COALESCE(reserved_stock, 0) AS reserved_stock
                FROM tcg_judge.store_products WHERE id = CAST(:id AS uuid)
                """
            ),
            {"id": product_id},
        )
    ).mappings().first()
    available = int(product["stock"]) - int(product.get("reserved_stock") or 0) if product else 0
    if not product or available < quantity:
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
