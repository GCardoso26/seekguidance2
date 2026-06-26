"""Stripe Connect — onboarding de lojas."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe
from app.core.config import Settings, get_settings

logger = structlog.get_logger(__name__)

STRIPE_CONNECT_ACCOUNT_TYPE = "express"
ONBOARDING_LINK_TTL_HOURS = 24


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


def _onboarding_link_expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(hours=ONBOARDING_LINK_TTL_HOURS)


async def _persist_merchant_onboarding_link(
    session: AsyncSession,
    owner_id: str,
    *,
    account_id: str,
    onboarding_url: str,
    expires_at: datetime,
) -> None:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.merchant_profiles
            SET onboarding_url = :url,
                onboarding_expires_at = :exp,
                provider_account_id = COALESCE(provider_account_id, :aid),
                updated_at = NOW()
            WHERE user_id = :uid
            """
        ),
        {"url": onboarding_url, "exp": expires_at, "aid": account_id, "uid": owner_id},
    )


async def create_account_onboarding_link(
    session: AsyncSession,
    owner_id: str,
    account_id: str,
    *,
    refresh_url: str | None = None,
    return_url: str | None = None,
    persist: bool = True,
) -> dict[str, Any]:
    """Cria AccountLink Stripe e persiste URL + expiração no merchant_profiles."""
    settings = get_settings()
    _init_stripe(settings)
    base_url = settings.marketplace_app_url or "https://judgetcg.com.br"
    refresh = refresh_url or f"{base_url}/vendedor/painel?onboarding=refresh"
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

    expires_at = _onboarding_link_expires_at()
    if persist:
        await _persist_merchant_onboarding_link(
            session,
            owner_id,
            account_id=account_id,
            onboarding_url=link.url,
            expires_at=expires_at,
        )
        await session.commit()

    return {
        "onboarding_url": link.url,
        "onboarding_expires_at": expires_at.isoformat(),
        "stripe_account_id": account_id,
    }


async def _resolve_connect_account_id(
    session: AsyncSession,
    owner_id: str,
    merchant: dict[str, Any],
) -> str | None:
    account_id = merchant.get("provider_account_id")
    if account_id:
        return str(account_id)
    store = await get_owner_store(session, owner_id)
    account_id = store.get("stripe_account_id") if store else None
    if account_id:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.merchant_profiles
                SET provider_account_id = :aid, updated_at = NOW()
                WHERE user_id = :uid AND provider_account_id IS NULL
                """
            ),
            {"aid": str(account_id), "uid": owner_id},
        )
        await session.commit()
    return str(account_id) if account_id else None


async def refresh_onboarding_link_if_expired(
    session: AsyncSession,
    owner_id: str,
    merchant: dict[str, Any],
    *,
    force: bool = False,
) -> dict[str, Any]:
    """Regenera AccountLink se expirado ou ausente (lojista ainda não verified)."""
    if merchant.get("kyc_status") == "verified":
        return {
            "kyc_status": "verified",
            "onboarding_url": None,
            "onboarding_expires_at": None,
            "refreshed": False,
        }

    account_id = await _resolve_connect_account_id(session, owner_id, merchant)
    if not account_id:
        return {
            "kyc_status": merchant.get("kyc_status"),
            "onboarding_url": merchant.get("onboarding_url"),
            "onboarding_expires_at": merchant.get("onboarding_expires_at"),
            "refreshed": False,
        }

    if not force:
        expires_raw = merchant.get("onboarding_expires_at")
        expires_at: datetime | None = None
        if expires_raw:
            if isinstance(expires_raw, datetime):
                expires_at = expires_raw if expires_raw.tzinfo else expires_raw.replace(tzinfo=UTC)
            else:
                expires_at = datetime.fromisoformat(str(expires_raw).replace("Z", "+00:00"))

        now = datetime.now(UTC)
        url = merchant.get("onboarding_url")
        if url and expires_at and expires_at > now:
            return {
                "kyc_status": merchant.get("kyc_status"),
                "onboarding_url": url,
                "onboarding_expires_at": expires_at.isoformat(),
                "refreshed": False,
            }

    link = await create_account_onboarding_link(session, owner_id, account_id)
    return {
        "kyc_status": merchant.get("kyc_status"),
        "onboarding_url": link["onboarding_url"],
        "onboarding_expires_at": link["onboarding_expires_at"],
        "refreshed": True,
    }


async def force_refresh_onboarding_link(
    session: AsyncSession,
    owner_id: str,
    merchant: dict[str, Any],
) -> dict[str, Any]:
    """Regenera link de onboarding (ex.: KYC rejected — re-onboarding)."""
    if merchant.get("kyc_status") == "verified":
        return await refresh_onboarding_link_if_expired(session, owner_id, merchant)

    account_id = await _resolve_connect_account_id(session, owner_id, merchant)
    if not account_id:
        raise HTTPException(404, "Conta Stripe Connect não encontrada")

    link = await create_account_onboarding_link(session, owner_id, account_id)
    return {
        "kyc_status": merchant.get("kyc_status"),
        "onboarding_url": link["onboarding_url"],
        "onboarding_expires_at": link["onboarding_expires_at"],
        "refreshed": True,
    }


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
                type=STRIPE_CONNECT_ACCOUNT_TYPE,
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

    refresh = refresh_url or f"{base_url}/vendedor/painel?onboarding=refresh"
    ret = return_url or f"{base_url}/vendedor/painel?onboarding=success"

    link_payload = await create_account_onboarding_link(
        session,
        owner_id,
        str(account_id),
        refresh_url=refresh,
        return_url=ret,
    )

    return {
        "store_id": str(store["id"]),
        "onboarding_url": link_payload["onboarding_url"],
        "onboarding_expires_at": link_payload["onboarding_expires_at"],
        "stripe_account_id": account_id,
    }


async def sync_merchant_kyc_for_owner(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    """Sincroniza kyc_status com Stripe após retorno do onboarding (return_url)."""
    store = await get_owner_store(session, owner_id)
    if not store:
        return {"synced": False, "reason": "no_store", "kyc_status": None}
    return await refresh_connect_status(session, str(store["id"]), owner_id)


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
