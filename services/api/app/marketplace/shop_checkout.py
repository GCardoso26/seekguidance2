"""Checkout Stripe PaymentIntent para marketplace."""

from __future__ import annotations

import json
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe
from app.core.config import get_settings
from app.marketplace import shop_cart
from app.marketplace.shop_commission import platform_fee_cents, store_receives_cents
from app.marketplace.shop_store import store_has_stripe, store_is_sellable

logger = structlog.get_logger(__name__)


async def _load_cart_items(session: AsyncSession, user_id: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    cart = await shop_cart.get_cart(session, user_id)
    items = shop_cart._parse_cart_items(cart.get("items"))
    if not items:
        raise HTTPException(400, "Carrinho vazio")
    return cart, items


def _locked_qty_credit(checkout_data: dict[str, Any]) -> dict[str, int]:
    """Quantidades já reservadas por esta sessão (não devem reduzir available)."""
    credit: dict[str, int] = {}
    for item in checkout_data.get("locked_items") or []:
        pid = str(item.get("product_id") or "")
        if not pid:
            continue
        credit[pid] = credit.get(pid, 0) + int(item.get("quantity") or 0)
    return credit


async def create_checkout(
    session: AsyncSession,
    user_id: str,
    *,
    shipping_address: dict[str, Any] | None = None,
    checkout_session_id: str | None = None,
    use_escrow: bool = False,
) -> dict[str, Any]:
    from sqlalchemy.exc import IntegrityError

    from app.kyc.player_account import require_active_account
    from app.marketplace import checkout_atomic, shop_escrow

    try:
        return await _create_checkout_inner(
            session,
            user_id,
            shipping_address=shipping_address,
            checkout_session_id=checkout_session_id,
            use_escrow=use_escrow,
            require_active_account=require_active_account,
            checkout_atomic=checkout_atomic,
            shop_escrow=shop_escrow,
        )
    except IntegrityError as exc:
        await session.rollback()
        logger.warning("checkout_integrity_error", user_id=user_id, error=str(exc))
        raise HTTPException(
            409,
            "Não foi possível iniciar o checkout (conflito de sessão). Tente novamente.",
        ) from exc


async def _create_checkout_inner(
    session: AsyncSession,
    user_id: str,
    *,
    shipping_address: dict[str, Any] | None,
    checkout_session_id: str | None,
    use_escrow: bool,
    require_active_account,
    checkout_atomic,
    shop_escrow,
) -> dict[str, Any]:
    await require_active_account(session, user_id)

    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Stripe não configurado")
    stripe.api_key = settings.stripe_secret_key

    created_here = False
    if checkout_session_id:
        checkout_data = await checkout_atomic.get_active_session(session, checkout_session_id, user_id)
        session_id = checkout_session_id
    else:
        checkout_data = await checkout_atomic.initiate_checkout(session, user_id)
        session_id = checkout_data["session_id"]
        created_here = True

    try:
        return await _build_stripe_checkout(
            session,
            user_id,
            shipping_address=shipping_address,
            use_escrow=use_escrow,
            checkout_data=checkout_data,
            session_id=session_id,
            shop_escrow=shop_escrow,
        )
    except Exception:
        if created_here:
            try:
                await checkout_atomic.cancel_checkout(session, session_id, user_id)
            except Exception as release_exc:
                logger.warning(
                    "checkout_release_after_failure",
                    session_id=session_id,
                    error=str(release_exc),
                )
        raise


async def _build_stripe_checkout(
    session: AsyncSession,
    user_id: str,
    *,
    shipping_address: dict[str, Any] | None,
    use_escrow: bool,
    checkout_data: dict[str, Any],
    session_id: str,
    shop_escrow,
) -> dict[str, Any]:
    cart, items = await _load_cart_items(session, user_id)
    locked_credit = _locked_qty_credit(checkout_data)

    store_splits: dict[str, dict[str, Any]] = {}
    total_cents = 0
    order_lines: list[dict[str, Any]] = []

    for item in items:
        product = (
            await session.execute(
                text(
                    """
                    SELECT p.*, s.stripe_account_id, s.commission_rate, s.shop_enabled,
                           s.stripe_onboarding_complete, s.name AS store_name,
                           s.owner_id AS store_owner_id,
                           COALESCE(p.reserved_stock, 0) AS reserved_stock
                    FROM tcg_judge.store_products p
                    JOIN tcg_judge.stores s ON s.id = p.store_id
                    WHERE p.id = :id AND p.is_active = true
                    """
                ),
                {"id": item["product_id"]},
            )
        ).mappings().first()
        if not product:
            raise HTTPException(400, f"Produto indisponível: {item.get('name')}")
        if not store_is_sellable(dict(product)):
            raise HTTPException(400, f"Loja não habilitada para vendas: {product.get('store_name')}")
        if not store_has_stripe(dict(product)):
            raise HTTPException(400, f"Loja não aceita cartão (Stripe): {product.get('store_name')}")

        qty = int(item.get("quantity", 0))
        reserved = int(product.get("reserved_stock") or 0)
        # initiate_checkout already reserved this session's qty — credit it back
        available = int(product["stock"]) - reserved + locked_credit.get(str(product["id"]), 0)
        if qty < 1 or qty > available:
            raise HTTPException(400, f"Estoque insuficiente: {product['name']}")

        line_total = int(product["price_cents"]) * qty
        total_cents += line_total
        store_id = str(product["store_id"])

        if store_id not in store_splits:
            store_splits[store_id] = {
                "amount_cents": 0,
                "stripe_account_id": product["stripe_account_id"],
                "commission_rate": float(product.get("commission_rate") or 0.15),
                "store_owner_id": str(product["store_owner_id"]),
                "lines": [],
            }
        store_splits[store_id]["amount_cents"] += line_total
        images = product.get("images") or []
        if not isinstance(images, list):
            images = []
        store_splits[store_id]["lines"].append(
            {
                "product_id": str(product["id"]),
                "product_name": product["name"],
                "product_image": images[0] if images else None,
                "quantity": qty,
                "unit_price_cents": int(product["price_cents"]),
                "total_price_cents": line_total,
            }
        )
        order_lines.append({"store_id": store_id, **store_splits[store_id]["lines"][-1]})

    transfer_group = f"cart_{cart['id']}"
    pending_orders: list[str] = []
    total_escrow_fee = 0

    if use_escrow and len(store_splits) != 1:
        raise HTTPException(400, "Compra protegida disponível apenas para pedidos de uma loja")

    for store_id, split in store_splits.items():
        commission_rate = float(split.get("commission_rate") or 0.15)
        product_amount = int(split["amount_cents"])
        platform_fee = 0
        if use_escrow:
            fees = shop_escrow.calculate_escrow_fees(product_amount)
            platform_fee = fees["escrow_fee_cents"]
            total_escrow_fee += platform_fee
            total_cents += platform_fee
        else:
            platform_fee = platform_fee_cents(product_amount, commission_rate)
        store_recv = product_amount - platform_fee
        payment_method = "escrow_stripe" if use_escrow else "stripe"
        order_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shop_orders (
                      buyer_id, store_id, status, total_cents,
                      platform_fee_cents, store_receives_cents,
                      shipping_address, stripe_transfer_group, payment_method,
                      use_escrow
                    ) VALUES (
                      :buyer, :store, 'pending', :total,
                      :fee, :store_recv, :addr::jsonb, :tg, :pm,
                      :use_escrow
                    )
                    RETURNING id
                    """
                ),
                {
                    "buyer": user_id,
                    "store": store_id,
                    "total": product_amount + (platform_fee if use_escrow else 0),
                    "fee": platform_fee,
                    "store_recv": store_recv,
                    "addr": json.dumps(shipping_address) if shipping_address else None,
                    "tg": transfer_group,
                    "pm": payment_method,
                    "use_escrow": use_escrow,
                },
            )
        ).mappings().first()
        order_id = str(order_row["id"]) if order_row else None
        if order_id:
            pending_orders.append(order_id)
            if use_escrow:
                await shop_escrow.create_escrow_for_order(
                    session,
                    shop_order_id=order_id,
                    buyer_id=user_id,
                    seller_id=str(split["store_owner_id"]),
                    amount_cents=product_amount,
                    payment_method="stripe",
                )
            for line in split["lines"]:
                await session.execute(
                    text(
                        """
                        INSERT INTO tcg_judge.shop_order_items (
                          order_id, product_id, product_name, product_image,
                          quantity, unit_price_cents, total_price_cents
                        ) VALUES (
                          :oid, :pid, :name, :img, :qty, :unit, :total
                        )
                        """
                    ),
                    {
                        "oid": order_id,
                        "pid": line["product_id"],
                        "name": line["product_name"],
                        "img": line.get("product_image"),
                        "qty": line["quantity"],
                        "unit": line["unit_price_cents"],
                        "total": line["total_price_cents"],
                    },
                )

    await session.commit()

    splits_meta = {k: v["amount_cents"] for k, v in store_splits.items()}
    transfer_splits_meta = {
        k: store_receives_cents(int(v["amount_cents"]), float(v.get("commission_rate") or 0.15))
        for k, v in store_splits.items()
    }
    connect_destination_charge = len(store_splits) == 1 and not use_escrow
    pi_kwargs: dict[str, Any] = {
        "amount": total_cents,
        "currency": "brl",
        "metadata": {
            "cart_id": str(cart["id"]),
            "buyer_id": user_id,
            "order_ids": ",".join(pending_orders),
            "store_splits": json.dumps(splits_meta),
            "store_transfer_splits": json.dumps(transfer_splits_meta),
            "checkout_session_id": session_id,
            "use_escrow": "true" if use_escrow else "false",
            "connect_destination_charge": "true" if connect_destination_charge else "false",
        },
    }

    if connect_destination_charge:
        store_id, split = next(iter(store_splits.items()))
        commission_rate = float(split.get("commission_rate") or 0.15)
        product_total = int(split["amount_cents"])
        platform_fee = platform_fee_cents(product_total, commission_rate)
        pi_kwargs["application_fee_amount"] = platform_fee
        pi_kwargs["transfer_data"] = {"destination": str(split["stripe_account_id"])}
        pi_kwargs["metadata"]["platform_fee_cents"] = str(platform_fee)
        pi_kwargs["metadata"]["destination_store_id"] = store_id
    else:
        pi_kwargs["transfer_group"] = transfer_group

    try:
        intent = stripe.PaymentIntent.create(**pi_kwargs)
    except stripe.StripeError as exc:
        logger.error("stripe_pi_create_error", error=str(exc))
        raise HTTPException(400, str(exc)) from exc

    for order_id in pending_orders:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_orders
                SET stripe_payment_intent_id = :pi, updated_at = NOW()
                WHERE id = :id
                """
            ),
            {"pi": intent.id, "id": order_id},
        )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.checkout_sessions
            SET payment_intent_id = :pi, payment_method = 'stripe', updated_at = NOW()
            WHERE id = :sid AND user_id = :uid
            """
        ),
        {"pi": intent.id, "sid": session_id, "uid": user_id},
    )
    await session.commit()

    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id,
        "total_cents": total_cents,
        "order_ids": pending_orders,
        "checkout_session_id": session_id,
        "expires_at": checkout_data.get("expires_at"),
        "use_escrow": use_escrow,
        "escrow_fee_cents": total_escrow_fee,
    }
