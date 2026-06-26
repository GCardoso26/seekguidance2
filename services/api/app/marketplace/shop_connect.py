"""Stripe Connect — onboarding de lojas."""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe
from app.core.config import Settings, get_settings

logger = structlog.get_logger(__name__)


def _init_stripe(settings: Settings) -> None:
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Stripe não configurado")
    stripe.api_key = settings.stripe_secret_key


async def get_owner_store(session: AsyncSession, owner_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE owner_id = :oid ORDER BY created_at LIMIT 1"),
            {"oid": owner_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def start_connect_onboarding(
    session: AsyncSession,
    owner_id: str,
    *,
    store_id: str | None = None,
    refresh_url: str | None = None,
    return_url: str | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    _init_stripe(settings)

    if store_id:
        store = (
            await session.execute(
                text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
                {"id": store_id, "oid": owner_id},
            )
        ).mappings().first()
    else:
        store_row = await get_owner_store(session, owner_id)
        store = store_row

    if not store:
        raise HTTPException(404, "Cadastre uma loja antes do onboarding Stripe")

    store = dict(store)
    account_id = store.get("stripe_account_id")
    base_url = settings.marketplace_app_url or "https://judgetcg.com.br"

    if not account_id:
        try:
            account = stripe.Account.create(
                type="express",
                country="BR",
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                business_profile={
                    "name": store["name"],
                    "url": f"{base_url}/marketplace/loja/{store['slug']}",
                },
                metadata={"store_id": str(store["id"]), "owner_id": owner_id},
            )
            account_id = account.id
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.stores
                    SET stripe_account_id = :aid, updated_at = NOW()
                    WHERE id = :id
                    """
                ),
                {"aid": account_id, "id": store["id"]},
            )
            await session.commit()
        except stripe.StripeError as exc:
            logger.error("stripe_connect_create_error", error=str(exc))
            raise HTTPException(400, str(exc)) from exc

    refresh = refresh_url or f"{base_url}/store/onboarding?refresh=true"
    ret = return_url or f"{base_url}/vendedor/painel?onboarding=success"

    try:
        link = stripe.AccountLink.create(
            account=account_id,
            refresh_url=refresh,
            return_url=ret,
            type="account_onboarding",
        )
    except stripe.StripeError as exc:
        logger.error("stripe_connect_link_error", error=str(exc))
        raise HTTPException(400, str(exc)) from exc

    return {"store_id": str(store["id"]), "onboarding_url": link.url, "stripe_account_id": account_id}


async def refresh_connect_status(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    settings = get_settings()
    _init_stripe(settings)

    store = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")
    store = dict(store)
    account_id = store.get("stripe_account_id")
    if not account_id:
        return {"complete": False, "shop_enabled": store.get("shop_enabled", False)}

    try:
        account = stripe.Account.retrieve(account_id)
    except stripe.StripeError as exc:
        raise HTTPException(400, str(exc)) from exc

    complete = bool(
        account.get("charges_enabled")
        and account.get("payouts_enabled")
        and account.get("details_submitted")
    )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.stores
            SET stripe_onboarding_complete = :complete,
                shop_enabled = CASE WHEN :complete THEN true ELSE shop_enabled END,
                updated_at = NOW()
            WHERE id = :id
            """
        ),
        {"complete": complete, "id": store_id},
    )
    await session.commit()
    from app.kyc.merchant_kyc import stripe_account_to_kyc_status, update_merchant_kyc_from_stripe

    kyc_status, reason = stripe_account_to_kyc_status(dict(account))
    await update_merchant_kyc_from_stripe(
        session,
        stripe_account_id=str(account_id),
        kyc_status=kyc_status,
        rejection_reason=reason,
        metadata={"source": "refresh_connect_status"},
    )
    return {
        "complete": complete,
        "shop_enabled": complete or store.get("shop_enabled"),
        "kyc_status": kyc_status,
    }
