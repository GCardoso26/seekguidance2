"""Assinaturas Pro/Enterprise — checkout Stripe ou PIX da plataforma."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe
from app.core.config import Settings
from app.marketplace.shop_notifications import notify_shop_event
from app.marketplace.shop_store import (
    ENTERPRISE_PRICE_CENTS,
    LOJISTA_PRICE_CENTS,
    PRO_PRICE_CENTS,
    effective_plan,
)

logger = structlog.get_logger(__name__)

PLAN_PRICES_CENTS = {
    "lojista": LOJISTA_PRICE_CENTS,
    "pro": PRO_PRICE_CENTS,
    "enterprise": ENTERPRISE_PRICE_CENTS,
}


async def get_subscription_status(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")
    store_dict = dict(store)
    return {
        "plan": effective_plan(store_dict),
        "raw_plan": store_dict.get("subscription_plan") or "free",
        "expires_at": store_dict.get("subscription_expires_at"),
        "cancel_at_period_end": False,
        "price_cents": PLAN_PRICES_CENTS.get(effective_plan(store_dict), 0),
    }


async def create_subscription_checkout(
    session: AsyncSession,
    settings: Settings,
    store_id: str,
    owner_id: str,
    plan: str,
    *,
    payment_method: str = "card",
    success_url: str | None = None,
    cancel_url: str | None = None,
) -> dict[str, Any]:
    if plan not in PLAN_PRICES_CENTS:
        raise HTTPException(400, "Plano inválido")
    if payment_method not in {"card", "pix"}:
        raise HTTPException(400, "Método de pagamento inválido")

    store = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    base_url = (settings.marketplace_app_url or "https://judgetcg.com.br").rstrip("/")
    success = success_url or f"{base_url}/store/dashboard?tab=pagamentos&pro=success"
    cancel = cancel_url or f"{base_url}/store/pro?cancelled=1"

    if payment_method == "card":
        if not settings.stripe_secret_key:
            raise HTTPException(503, "Cartão indisponível — configure Stripe ou use PIX")
        price_map = {
            "lojista": settings.stripe_price_store_lojista,
            "pro": settings.stripe_price_store_pro,
            "enterprise": settings.stripe_price_store_enterprise,
        }
        price_id = price_map.get(plan) or (
            settings.stripe_price_store_pro if plan == "lojista" else None
        )
        if not price_id:
            raise HTTPException(503, f"Preço Stripe {plan} não configurado no servidor")

        stripe.api_key = settings.stripe_secret_key
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{"price": price_id, "quantity": 1}],
                mode="subscription",
                success_url=success,
                cancel_url=cancel,
                metadata={"store_id": store_id, "owner_id": owner_id, "plan": plan, "kind": "store_pro"},
                subscription_data={"metadata": {"store_id": store_id, "plan": plan, "kind": "store_pro"}},
            )
        except stripe.StripeError as exc:
            logger.error("store_pro_checkout_error", error=str(exc))
            raise HTTPException(400, str(exc)) from exc

        return {
            "payment_method": "card",
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
        }

    if not settings.platform_pix_key:
        raise HTTPException(503, "PIX Pro indisponível — configure PLATFORM_PIX_KEY")

    txid = f"PRO{uuid.uuid4().hex[:12].upper()}"
    amount = PLAN_PRICES_CENTS[plan]
    expires = datetime.now(UTC) + timedelta(hours=24)

    pix_row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.pix_transactions (
                  order_id, txid, pix_key, pix_key_type, amount_cents, status, expires_at, payload,
                  gateway_provider
                ) VALUES (
                  NULL, :txid, :key, :key_type, :amt, 'pending', :exp, :payload, 'platform_pro'
                )
                RETURNING id
                """
            ),
            {
                "txid": txid,
                "key": settings.platform_pix_key,
                "key_type": settings.platform_pix_key_type or "random",
                "amt": amount,
                "exp": expires,
                "payload": json.dumps({"kind": "store_pro", "store_id": store_id, "plan": plan}),
            },
        )
    ).mappings().first()

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.store_subscriptions
              (store_id, plan, amount_cents, status, expires_at, payment_method, pix_transaction_id)
            VALUES (:sid, :plan, :amt, 'pending', :exp, 'pix', :pix_id)
            """
        ),
        {
            "sid": store_id,
            "plan": plan,
            "amt": amount,
            "exp": expires,
            "pix_id": str(pix_row["id"]) if pix_row else None,
        },
    )
    await session.commit()

    return {
        "payment_method": "pix",
        "txid": txid,
        "pix_key": settings.platform_pix_key,
        "amount_cents": amount,
        "expires_at": expires.isoformat(),
        "copy_payload": (
            f"Assinatura Pro Loja — Judge TCG\n"
            f"Plano: {plan}\n"
            f"Valor: R$ {amount / 100:.2f}\n"
            f"Identificador: {txid}"
        ),
    }


async def activate_store_subscription(
    session: AsyncSession,
    store_id: str,
    plan: str,
    *,
    stripe_subscription_id: str | None = None,
    payment_method: str = "card",
    days: int = 30,
) -> dict[str, Any]:
    expires = datetime.now(UTC) + timedelta(days=days)
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.stores SET
                  subscription_plan = :plan,
                  subscription_expires_at = :exp,
                  stripe_subscription_id = COALESCE(:sub_id, stripe_subscription_id),
                  updated_at = NOW()
                WHERE id = :id
                RETURNING *
                """
            ),
            {"plan": plan, "exp": expires, "sub_id": stripe_subscription_id, "id": store_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")

    await session.execute(
        text(
            """
            UPDATE tcg_judge.store_subscriptions
            SET status = 'active', expires_at = :exp, payment_method = :pm
            WHERE store_id = :sid AND status IN ('pending', 'active')
            """
        ),
        {"exp": expires, "pm": payment_method, "sid": store_id},
    )

    owner = (
        await session.execute(
            text("SELECT owner_id FROM tcg_judge.stores WHERE id = :id"),
            {"id": store_id},
        )
    ).mappings().first()

    await notify_shop_event(
        session,
        "shop:pro_activated",
        store_owner_id=str(owner["owner_id"]) if owner else None,
        body=f"Plano {plan} ativo até {expires.date().isoformat()}",
        data={"store_id": store_id, "plan": plan},
    )
    await session.commit()
    return dict(row)


async def confirm_pro_pix_payment(session: AsyncSession, txid: str) -> dict[str, Any]:
    pix_tx = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.pix_transactions
                WHERE txid = :txid AND gateway_provider = 'platform_pro'
                """
            ),
            {"txid": txid},
        )
    ).mappings().first()
    if not pix_tx:
        raise HTTPException(404, "PIX Pro não encontrado")
    if pix_tx["status"] == "paid":
        return {"status": "paid", "txid": txid}

    payload = json.loads(pix_tx.get("payload") or "{}")
    store_id = payload.get("store_id")
    plan = payload.get("plan", "pro")
    if not store_id:
        raise HTTPException(400, "PIX Pro sem store_id")

    await session.execute(
        text("UPDATE tcg_judge.pix_transactions SET status = 'paid', paid_at = NOW() WHERE txid = :txid"),
        {"txid": txid},
    )
    store = await activate_store_subscription(session, str(store_id), str(plan), payment_method="pix")
    return {"status": "paid", "store": store}


async def cancel_subscription(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    settings: Settings,
) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    sub_id = store.get("stripe_subscription_id")
    if sub_id and settings.stripe_secret_key:
        stripe.api_key = settings.stripe_secret_key
        try:
            stripe.Subscription.modify(str(sub_id), cancel_at_period_end=True)
        except stripe.StripeError as exc:
            logger.warning("stripe_cancel_failed", error=str(exc))

    await session.execute(
        text(
            """
            UPDATE tcg_judge.store_subscriptions
            SET cancel_at_period_end = TRUE
            WHERE store_id = :sid AND status = 'active'
            """
        ),
        {"sid": store_id},
    )
    await session.commit()
    return {"status": "cancel_scheduled", "expires_at": store.get("subscription_expires_at")}


async def subscribe_store(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    plan: str,
) -> dict[str, Any]:
    """Ativação direta (dev/staging) — produção deve usar create_subscription_checkout."""
    return await activate_store_subscription(session, store_id, plan, payment_method="manual")
