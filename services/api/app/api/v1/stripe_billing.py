"""Stripe Checkout, Portal, Webhooks e estado de subscrição."""

from __future__ import annotations

from typing import Any

import structlog
from app.api.deps import DbSession, SettingsDep
from app.judge.analytics_events import record_analytics_events
from app.judge.stripe_service import (
    cancel_subscription_row,
    features_for_tier,
    free_features,
    get_or_create_customer,
    get_subscription_row,
    insert_invoice,
    resolve_price_id,
    stripe_enabled,
    sync_subscription_from_stripe,
    tier_from_price_id,
    update_subscription_status,
    upsert_subscription,
)
from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import stripe

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["stripe-billing"])


class CheckoutBody(BaseModel):
    price_id: str
    tier: str = "spike"
    success_url: str | None = None
    cancel_url: str | None = None
    email: str | None = None
    name: str | None = None


class PortalBody(BaseModel):
    return_url: str | None = None


def _require_user(x_judge_user_id: str | None) -> str:
    uid = (x_judge_user_id or "").strip()
    if not uid:
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    return uid


def _require_stripe(settings: SettingsDep) -> None:
    if not stripe_enabled(settings):
        raise HTTPException(status_code=503, detail="Stripe não configurado no servidor")


@router.post("/runtime/judge/stripe/checkout")
async def create_checkout(
    body: CheckoutBody,
    session: DbSession,
    settings: SettingsDep,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_stripe(settings)
    user_id = _require_user(x_judge_user_id)
    stripe.api_key = settings.stripe_secret_key

    resolved = resolve_price_id(settings, body.price_id)
    if not resolved:
        raise HTTPException(status_code=400, detail="price_id inválido")

    tier = body.tier if body.tier in ("spike", "team") else tier_from_price_id(settings, resolved)
    success = body.success_url or settings.stripe_checkout_success_url or "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}"
    cancel = body.cancel_url or settings.stripe_checkout_cancel_url or "http://localhost:3000/pricing"

    customer_id = await get_or_create_customer(session, user_id, body.email, body.name)

    sub_data: dict[str, Any] = {"metadata": {"user_id": user_id}}
    if settings.stripe_trial_days > 0:
        sub_data["trial_period_days"] = settings.stripe_trial_days

    try:
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": resolved, "quantity": 1}],
            mode="subscription",
            success_url=success,
            cancel_url=cancel,
            metadata={"user_id": user_id, "tier": tier},
            subscription_data=sub_data,
            allow_promotion_codes=True,
        )
    except stripe.StripeError as exc:
        logger.error("stripe_checkout_error", error=str(exc))
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await record_analytics_events(
        session,
        [
            {
                "event": "checkout_started",
                "user_id": user_id,
                "properties": {"price_id": resolved, "tier": tier, "session_id": checkout_session.id},
            }
        ],
    )

    return {"session_id": checkout_session.id, "url": checkout_session.url}


@router.post("/runtime/judge/stripe/webhook")
async def stripe_webhook(request: Request, session: DbSession, settings: SettingsDep) -> JSONResponse:
    _require_stripe(settings)
    stripe.api_key = settings.stripe_secret_key
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    if not sig:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret or "")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    etype = event["type"]
    data = event["data"]["object"]

    if etype == "checkout.session.completed":
        await _handle_checkout_completed(session, settings, data)
    elif etype == "invoice.paid":
        await _handle_invoice_paid(session, data)
    elif etype == "invoice.payment_failed":
        sub_id = data.get("subscription")
        if sub_id:
            await update_subscription_status(session, str(sub_id), "past_due")
        uid = (data.get("metadata") or {}).get("user_id")
        await record_analytics_events(
            session,
            [{"event": "checkout_failed", "user_id": uid, "properties": {"invoice_id": data.get("id")}}],
        )
    elif etype == "customer.subscription.updated":
        await sync_subscription_from_stripe(session, data)
    elif etype == "customer.subscription.deleted":
        await cancel_subscription_row(session, str(data.get("id")), data.get("canceled_at"))
        await record_analytics_events(
            session,
            [{"event": "subscription_cancelled", "properties": {"subscription_id": data.get("id")}}],
        )
    elif etype == "payment_intent.succeeded":
        meta = data.get("metadata") or {}
        if meta.get("store_splits") or meta.get("order_ids"):
            from app.marketplace.shop_orders import handle_payment_intent_succeeded

            await handle_payment_intent_succeeded(session, settings, data)
    elif etype == "account.updated":
        await _handle_connect_account_updated(session, event["id"], data)

    return JSONResponse({"status": "success"})


async def _handle_connect_account_updated(
    session: DbSession, event_id: str, account: dict[str, Any]
) -> None:
    from app.kyc.merchant_kyc import stripe_account_to_kyc_status, update_merchant_kyc_from_stripe

    kyc_status, reason = stripe_account_to_kyc_status(account)
    await update_merchant_kyc_from_stripe(
        session,
        stripe_account_id=str(account.get("id") or ""),
        kyc_status=kyc_status,
        rejection_reason=reason,
        provider_event_id=event_id,
        metadata={"charges_enabled": account.get("charges_enabled"), "payouts_enabled": account.get("payouts_enabled")},
    )


async def _handle_checkout_completed(session: DbSession, settings: SettingsDep, checkout: dict[str, Any]) -> None:
    meta = checkout.get("metadata") or {}
    if meta.get("kind") == "store_pro" and meta.get("store_id"):
        from app.stores.subscriptions import activate_store_subscription

        await activate_store_subscription(
            session,
            str(meta["store_id"]),
            str(meta.get("plan") or "pro"),
            stripe_subscription_id=str(checkout.get("subscription") or ""),
            payment_method="card",
        )
        return

    user_id = meta.get("user_id")
    subscription_id = checkout.get("subscription")
    if not user_id or not subscription_id:
        return

    stripe.api_key = settings.stripe_secret_key
    stripe_sub = stripe.Subscription.retrieve(str(subscription_id))
    items = (stripe_sub.get("items") or {}).get("data") or []
    price_id = items[0]["price"]["id"] if items else None
    tier = meta.get("tier") or tier_from_price_id(settings, price_id or "")

    await upsert_subscription(
        session,
        user_id=str(user_id),
        stripe_customer_id=str(checkout.get("customer") or ""),
        stripe_subscription_id=str(subscription_id),
        stripe_price_id=price_id,
        status=str(stripe_sub.get("status", "active")),
        tier=str(tier),
        current_period_start=stripe_sub.get("current_period_start"),
        current_period_end=stripe_sub.get("current_period_end"),
        trial_start=stripe_sub.get("trial_start"),
        trial_end=stripe_sub.get("trial_end"),
    )

    await record_analytics_events(
        session,
        [
            {
                "event": "checkout_completed",
                "user_id": str(user_id),
                "properties": {"subscription_id": subscription_id, "tier": tier},
            },
            {
                "event": "subscription_renewed",
                "user_id": str(user_id),
                "properties": {"tier": tier},
            },
        ],
    )


async def _handle_invoice_paid(session: DbSession, invoice: dict[str, Any]) -> None:
    meta = invoice.get("metadata") or {}
    await insert_invoice(
        session,
        user_id=meta.get("user_id"),
        stripe_customer_id=invoice.get("customer"),
        stripe_invoice_id=str(invoice["id"]),
        stripe_subscription_id=invoice.get("subscription"),
        amount_due=invoice.get("amount_due"),
        amount_paid=invoice.get("amount_paid"),
        currency=invoice.get("currency"),
        status=invoice.get("status"),
        invoice_pdf=invoice.get("invoice_pdf"),
        hosted_invoice_url=invoice.get("hosted_invoice_url"),
        period_start=invoice.get("period_start"),
        period_end=invoice.get("period_end"),
    )
    await record_analytics_events(
        session,
        [
            {
                "event": "checkout_completed",
                "user_id": meta.get("user_id"),
                "properties": {"invoice_id": invoice.get("id"), "amount": invoice.get("amount_paid")},
            }
        ],
    )


@router.post("/runtime/judge/stripe/portal")
async def create_portal(
    body: PortalBody,
    session: DbSession,
    settings: SettingsDep,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, str]:
    _require_stripe(settings)
    user_id = _require_user(x_judge_user_id)
    stripe.api_key = settings.stripe_secret_key

    row = await get_subscription_row(session, user_id)
    if not row or not row.get("stripe_customer_id"):
        raise HTTPException(status_code=404, detail="Cliente Stripe não encontrado")

    return_url = body.return_url or "http://localhost:3000/settings/billing"
    try:
        portal = stripe.billing_portal.Session.create(
            customer=str(row["stripe_customer_id"]),
            return_url=return_url,
        )
    except stripe.StripeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await record_analytics_events(
        session,
        [{"event": "upgrade_modal_open", "user_id": user_id, "properties": {"portal": True}}],
    )
    return {"url": portal.url}


@router.get("/runtime/judge/stripe/subscription")
async def get_subscription(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    row = await get_subscription_row(session, user_id)
    if not row or row.get("tier") == "free" and row.get("status") not in ("active", "trialing"):
        return {
            "tier": "free",
            "status": "active",
            "features": free_features(),
        }

    tier = str(row.get("tier") or "free")
    if tier == "spike":
        tier_display = "pro"
    else:
        tier_display = tier

    period_end = row.get("current_period_end")
    return {
        "tier": tier_display,
        "tier_raw": tier,
        "status": row.get("status"),
        "current_period_end": period_end.isoformat() if period_end else None,
        "cancel_at_period_end": bool(row.get("cancel_at_period_end")),
        "features": features_for_tier(tier),
    }


@router.get("/runtime/judge/stripe/invoices")
async def list_invoices(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    from sqlalchemy import text

    user_id = _require_user(x_judge_user_id)
    rows = (
        await session.execute(
            text(
                """
                SELECT stripe_invoice_id, amount_due, amount_paid, currency, status,
                       hosted_invoice_url, period_start, period_end, created_at
                FROM tcg_judge.invoices
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 24
                """
            ),
            {"user_id": user_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
