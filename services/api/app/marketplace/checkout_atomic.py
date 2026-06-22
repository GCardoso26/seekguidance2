"""Checkout atômico com SELECT FOR UPDATE em store_products e card_listings."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import shop_cart
from app.players.store import ensure_player_profile

logger = structlog.get_logger(__name__)

CHECKOUT_TIMEOUT_MINUTES = 15


def _parse_locked_items(raw: Any) -> list[dict[str, Any]]:
    if raw is None:
        return []
    if isinstance(raw, str):
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    if isinstance(raw, list):
        return list(raw)
    return []


async def _sync_listing_reserve(
    session: AsyncSession,
    product_id: str,
    delta: int,
) -> str | None:
    """Ajusta reserved_quantity na card_listing ligada ao produto."""
    row = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.card_listings
                WHERE store_product_id = :pid AND status = 'active'
                LIMIT 1
                """
            ),
            {"pid": product_id},
        )
    ).mappings().first()
    if not row:
        return None
    listing_id = str(row["id"])
    await session.execute(
        text(
            """
            UPDATE tcg_judge.card_listings
            SET reserved_quantity = GREATEST(reserved_quantity + :delta, 0),
                version = version + 1,
                updated_at = NOW()
            WHERE id = :lid
            """
        ),
        {"lid": listing_id, "delta": delta},
    )
    return listing_id


async def initiate_checkout(
    session: AsyncSession,
    user_id: str,
    *,
    cart_id: str | None = None,
) -> dict[str, Any]:
    """Reserva estoque com lock pessimista (FOR UPDATE NOWAIT)."""
    await ensure_player_profile(session, user_id)
    cart = await shop_cart.get_cart(session, user_id)
    if cart_id and str(cart.get("id")) != str(cart_id):
        raise HTTPException(404, "Carrinho não encontrado")

    items = list(cart.get("items") or [])
    if not items:
        raise HTTPException(400, "Carrinho vazio")

    product_ids = [str(item["product_id"]) for item in items if item.get("product_id")]
    if not product_ids:
        raise HTTPException(400, "Itens do carrinho inválidos")

    try:
        result = await session.execute(
            text(
                """
                SELECT p.id, p.stock, COALESCE(p.reserved_stock, 0) AS reserved_stock,
                       p.price_cents, p.name, p.store_id, s.owner_id AS seller_id
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE p.id = ANY(CAST(:ids AS uuid[]))
                  AND p.is_active = true
                FOR UPDATE OF p NOWAIT
                """
            ),
            {"ids": product_ids},
        )
        products = {str(row["id"]): dict(row) for row in result.mappings()}
    except Exception as exc:
        logger.warning("checkout_lock_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Item sendo processado por outro comprador. Tente novamente em instantes.",
        ) from exc

    locked_items: list[dict[str, Any]] = []
    total_cents = 0

    for item in items:
        product_id = str(item["product_id"])
        requested_qty = int(item.get("quantity", 0))
        if requested_qty < 1:
            raise HTTPException(400, "Quantidade inválida")

        product = products.get(product_id)
        if not product:
            raise HTTPException(400, f"Produto indisponível: {item.get('name', product_id)}")

        available = int(product["stock"]) - int(product["reserved_stock"])
        if available < requested_qty:
            raise HTTPException(
                status_code=400,
                detail=f"{product['name']}: apenas {max(available, 0)} disponível (você pediu {requested_qty})",
            )

        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_products
                SET reserved_stock = reserved_stock + :qty, updated_at = NOW()
                WHERE id = :pid
                """
            ),
            {"pid": product_id, "qty": requested_qty},
        )
        listing_id = await _sync_listing_reserve(session, product_id, requested_qty)

        unit_price = int(product["price_cents"])
        total_cents += unit_price * requested_qty
        locked_items.append(
            {
                "product_id": product_id,
                "listing_id": listing_id,
                "quantity": requested_qty,
                "unit_price_cents": unit_price,
                "seller_id": str(product["seller_id"]),
                "store_id": str(product["store_id"]),
                "product_name": product["name"],
                "reserved_at": datetime.now(UTC).isoformat(),
            }
        )

    expires_at = datetime.now(UTC) + timedelta(minutes=CHECKOUT_TIMEOUT_MINUTES)
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.checkout_sessions (
                  user_id, cart_id, locked_items, status, expires_at
                ) VALUES (
                  :uid, :cart_id, CAST(:items AS jsonb), 'active', :expires
                )
                RETURNING id, expires_at, status, locked_items, created_at
                """
            ),
            {
                "uid": user_id,
                "cart_id": str(cart["id"]),
                "items": json.dumps(locked_items),
                "expires": expires_at,
            },
        )
    ).mappings().first()
    await session.commit()

    if not row:
        raise HTTPException(500, "Falha ao criar sessão de checkout")

    return {
        "session_id": str(row["id"]),
        "expires_at": row["expires_at"].isoformat() if row.get("expires_at") else expires_at.isoformat(),
        "locked_items": locked_items,
        "total_cents": total_cents,
        "status": row["status"],
    }


async def get_checkout_session(
    session: AsyncSession,
    session_id: str,
    user_id: str,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.checkout_sessions
                WHERE id = :id AND user_id = :uid
                """
            ),
            {"id": session_id, "uid": user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Sessão não encontrada")
    data = dict(row)
    data["id"] = str(data["id"])
    if data.get("cart_id"):
        data["cart_id"] = str(data["cart_id"])
    data["locked_items"] = _parse_locked_items(data.get("locked_items"))
    if data.get("expires_at"):
        data["expires_at"] = data["expires_at"].isoformat()
    return data


async def get_active_session(
    session: AsyncSession,
    session_id: str,
    user_id: str,
) -> dict[str, Any]:
    data = await get_checkout_session(session, session_id, user_id)
    if data["status"] != "active":
        raise HTTPException(400, f"Sessão {data['status']}")
    expires = data.get("expires_at")
    if expires and datetime.fromisoformat(expires.replace("Z", "+00:00")) < datetime.now(UTC):
        await _release_session_stock(session, data)
        await session.execute(
            text("UPDATE tcg_judge.checkout_sessions SET status = 'expired' WHERE id = :id"),
            {"id": session_id},
        )
        await session.commit()
        raise HTTPException(400, "Sessão expirada. Inicie checkout novamente.")
    return data


async def _release_session_stock(session: AsyncSession, checkout_session: dict[str, Any]) -> None:
    for item in _parse_locked_items(checkout_session.get("locked_items")):
        qty = int(item.get("quantity", 0))
        if qty < 1:
            continue
        product_id = item.get("product_id")
        if product_id:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_products
                    SET reserved_stock = GREATEST(reserved_stock - :qty, 0), updated_at = NOW()
                    WHERE id = :pid
                    """
                ),
                {"pid": product_id, "qty": qty},
            )
        listing_id = item.get("listing_id")
        if listing_id:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.card_listings
                    SET reserved_quantity = GREATEST(reserved_quantity - :qty, 0),
                        version = version + 1,
                        updated_at = NOW()
                    WHERE id = :lid
                    """
                ),
                {"lid": listing_id, "qty": qty},
            )


async def cancel_checkout(
    session: AsyncSession,
    session_id: str,
    user_id: str,
) -> dict[str, Any]:
    data = await get_checkout_session(session, session_id, user_id)
    if data["status"] != "active":
        return {"status": data["status"]}
    await _release_session_stock(session, data)
    await session.execute(
        text(
            """
            UPDATE tcg_judge.checkout_sessions
            SET status = 'cancelled', completed_at = NOW()
            WHERE id = :id
            """
        ),
        {"id": session_id},
    )
    await session.commit()
    return {"status": "cancelled"}


async def finalize_checkout(
    session: AsyncSession,
    session_id: str,
    *,
    payment_intent_id: str | None = None,
    payment_method: str | None = None,
) -> dict[str, Any]:
    """Deduz estoque definitivamente após pagamento confirmado."""
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.checkout_sessions WHERE id = :id FOR UPDATE"),
            {"id": session_id},
        )
    ).mappings().first()
    if not row:
        return {"skipped": True, "reason": "session_not_found"}

    data = dict(row)
    if data["status"] == "completed":
        return {"status": "completed", "session_id": session_id}

    if data["status"] != "active":
        return {"skipped": True, "reason": data["status"]}

    for item in _parse_locked_items(data.get("locked_items")):
        qty = int(item.get("quantity", 0))
        product_id = item.get("product_id")
        if not product_id or qty < 1:
            continue

        updated = (
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_products
                    SET stock = GREATEST(stock - :qty, 0),
                        reserved_stock = GREATEST(reserved_stock - :qty, 0),
                        updated_at = NOW()
                    WHERE id = :pid
                      AND reserved_stock >= :qty
                    RETURNING id
                    """
                ),
                {"pid": product_id, "qty": qty},
            )
        ).first()
        if not updated:
            logger.error("checkout_finalize_stock_failed", product_id=product_id, qty=qty)
            raise HTTPException(400, f"Estoque insuficiente para produto {product_id}")

        listing_id = item.get("listing_id")
        if listing_id:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.card_listings
                    SET quantity = GREATEST(quantity - :qty, 0),
                        reserved_quantity = GREATEST(reserved_quantity - :qty, 0),
                        status = CASE WHEN quantity - :qty <= 0 THEN 'sold' ELSE status END,
                        version = version + 1,
                        updated_at = NOW()
                    WHERE id = :lid
                    """
                ),
                {"lid": listing_id, "qty": qty},
            )

    await session.execute(
        text(
            """
            UPDATE tcg_judge.checkout_sessions
            SET status = 'completed',
                completed_at = NOW(),
                payment_intent_id = COALESCE(:pi, payment_intent_id),
                payment_method = COALESCE(:pm, payment_method)
            WHERE id = :id
            """
        ),
        {"id": session_id, "pi": payment_intent_id, "pm": payment_method},
    )
    await session.commit()
    return {"status": "completed", "session_id": session_id}


async def expire_stale_sessions(session: AsyncSession) -> int:
    result = await session.execute(text("SELECT tcg_judge.expire_checkout_sessions()"))
    count = int(result.scalar() or 0)
    await session.commit()
    return count


async def finalize_by_payment_intent(
    session: AsyncSession,
    payment_intent_id: str,
) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.checkout_sessions
                WHERE payment_intent_id = :pi AND status = 'active'
                ORDER BY created_at DESC
                LIMIT 1
                """
            ),
            {"pi": payment_intent_id},
        )
    ).mappings().first()
    if not row:
        return None
    return await finalize_checkout(session, str(row["id"]), payment_intent_id=payment_intent_id)
