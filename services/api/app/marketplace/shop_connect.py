"""Stripe Connect — onboarding de lojas (Accounts V2 + fallback Express v1)."""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe
from stripe import StripeClient
from app.core.config import Settings, get_settings

logger = structlog.get_logger(__name__)

STRIPE_CONNECT_ACCOUNT_TYPE = "express"
ONBOARDING_LINK_TTL_HOURS = 24


def _init_stripe(settings: Settings) -> None:
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Stripe não configurado")
    stripe.api_key = settings.stripe_secret_key


def _stripe_client(settings: Settings) -> StripeClient:
    _init_stripe(settings)
    return StripeClient(settings.stripe_secret_key)


def _prefer_accounts_v2() -> bool:
    """Accounts V2 (blueprint marketplace). Desligar com STRIPE_CONNECT_ACCOUNTS_API=v1."""
    mode = (os.environ.get("STRIPE_CONNECT_ACCOUNTS_API") or "v2").strip().lower()
    return mode != "v1"


def _payments_return_urls(settings: Settings) -> tuple[str, str]:
    base_url = (settings.marketplace_app_url or "https://judgetcg.com.br").rstrip("/")
    refresh = f"{base_url}/vendedor/painel/configuracoes/pagamentos?onboarding=refresh"
    ret = f"{base_url}/vendedor/painel/configuracoes/pagamentos?onboarding=success"
    return refresh, ret


async def get_owner_store(session: AsyncSession, owner_id: str) -> dict[str, Any] | None:
    """Mesma ordem que seller_dashboard.resolve_owner_store (multi-loja / PIX / Stripe)."""
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.stores
                WHERE owner_id = :oid
                ORDER BY
                  CASE WHEN shop_enabled THEN 0 ELSE 1 END,
                  CASE lower(COALESCE(subscription_plan, 'free'))
                    WHEN 'enterprise' THEN 0
                    WHEN 'pro' THEN 1
                    WHEN 'lojista' THEN 2
                    ELSE 3
                  END,
                  created_at DESC
                LIMIT 1
                """
            ),
            {"oid": owner_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def _owner_contact_email(session: AsyncSession, owner_id: str, store_name: str) -> str:
    row = (
        await session.execute(
            text("SELECT email FROM auth.users WHERE id::text = :uid LIMIT 1"),
            {"uid": owner_id},
        )
    ).first()
    if row and row[0]:
        return str(row[0])
    slug = "".join(ch for ch in store_name.lower() if ch.isalnum())[:24] or "loja"
    return f"{slug}-{owner_id[:8]}@sellers.judgetcg.local"


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


def _create_connected_account_v2(
    client: StripeClient,
    *,
    display_name: str,
    contact_email: str,
    store_id: str,
    owner_id: str,
) -> str:
    """POST /v2/core/accounts — merchant + recipient (destination charges)."""
    account = client.v2.core.accounts.create(
        {
            "display_name": display_name[:150],
            "contact_email": contact_email,
            "configuration": {
                "recipient": {
                    "capabilities": {
                        "stripe_balance": {
                            "stripe_transfers": {"requested": True},
                        },
                    },
                },
                "merchant": {
                    "capabilities": {
                        "card_payments": {"requested": True},
                    },
                },
            },
            "defaults": {
                "responsibilities": {
                    "losses_collector": "application",
                    "fees_collector": "application",
                },
            },
            "dashboard": "express",
            "include": [
                "configuration.merchant",
                "configuration.recipient",
                "identity",
                "defaults",
                "configuration.customer",
            ],
            "identity": {"country": "br"},
            "metadata": {"store_id": store_id, "owner_id": owner_id, "connect_api": "v2"},
        }
    )
    account_id = getattr(account, "id", None) or (account.get("id") if isinstance(account, dict) else None)
    if not account_id:
        raise HTTPException(502, "Stripe V2 não retornou account id")
    return str(account_id)


def _create_connected_account_v1(
    *,
    display_name: str,
    store_id: str,
    owner_id: str,
    store_slug: str,
    base_url: str,
) -> str:
    """Fallback Express Accounts v1."""
    account = stripe.Account.create(
        type=STRIPE_CONNECT_ACCOUNT_TYPE,
        country="BR",
        capabilities={
            "card_payments": {"requested": True},
            "transfers": {"requested": True},
        },
        business_profile={
            "name": display_name,
            "url": f"{base_url}/marketplace/loja/{store_slug}",
        },
        metadata={"store_id": store_id, "owner_id": owner_id, "connect_api": "v1"},
    )
    return str(account.id)


def _create_account_link_v2(
    client: StripeClient,
    *,
    account_id: str,
    refresh_url: str,
    return_url: str,
) -> str:
    """POST /v2/core/account_links — KYC hosted (recipient + merchant)."""
    link = client.v2.core.account_links.create(
        {
            "account": account_id,
            "use_case": {
                "type": "account_onboarding",
                "account_onboarding": {
                    "configurations": ["recipient", "merchant"],
                    "refresh_url": refresh_url,
                    "return_url": return_url,
                },
            },
        }
    )
    url = getattr(link, "url", None) or (link.get("url") if isinstance(link, dict) else None)
    if not url:
        raise HTTPException(502, "Stripe V2 não retornou onboarding URL")
    return str(url)


def _create_account_link_v1(
    *,
    account_id: str,
    refresh_url: str,
    return_url: str,
) -> str:
    link = stripe.AccountLink.create(
        account=account_id,
        refresh_url=refresh_url,
        return_url=return_url,
        type="account_onboarding",
    )
    return str(link.url)


async def create_account_onboarding_link(
    session: AsyncSession,
    owner_id: str,
    account_id: str,
    *,
    refresh_url: str | None = None,
    return_url: str | None = None,
    persist: bool = True,
    prefer_v2: bool | None = None,
) -> dict[str, Any]:
    """Cria AccountLink (V2 preferencial; fallback v1) e persiste URL no merchant_profiles."""
    settings = get_settings()
    _init_stripe(settings)
    default_refresh, default_return = _payments_return_urls(settings)
    refresh = refresh_url or default_refresh
    ret = return_url or default_return
    use_v2 = _prefer_accounts_v2() if prefer_v2 is None else prefer_v2

    try:
        if use_v2:
            try:
                url = _create_account_link_v2(
                    _stripe_client(settings),
                    account_id=account_id,
                    refresh_url=refresh,
                    return_url=ret,
                )
                api = "v2"
            except Exception as v2_exc:
                logger.warning("stripe_v2_account_link_fallback", error=str(v2_exc), account=account_id)
                url = _create_account_link_v1(
                    account_id=account_id, refresh_url=refresh, return_url=ret
                )
                api = "v1"
        else:
            url = _create_account_link_v1(
                account_id=account_id, refresh_url=refresh, return_url=ret
            )
            api = "v1"
    except stripe.StripeError as exc:
        logger.error("stripe_connect_link_error", error=str(exc))
        raise HTTPException(400, str(exc)) from exc

    expires_at = _onboarding_link_expires_at()
    if persist:
        await _persist_merchant_onboarding_link(
            session,
            owner_id,
            account_id=account_id,
            onboarding_url=url,
            expires_at=expires_at,
        )
        await session.commit()

    return {
        "onboarding_url": url,
        "onboarding_expires_at": expires_at.isoformat(),
        "stripe_account_id": account_id,
        "connect_api": api,
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
    client = _stripe_client(settings)
    base_url = (settings.marketplace_app_url or "https://judgetcg.com.br").rstrip("/")

    if store_id:
        store = (
            await session.execute(
                text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
                {"id": store_id, "oid": owner_id},
            )
        ).mappings().first()
    else:
        store = await get_owner_store(session, owner_id)

    if not store:
        raise HTTPException(404, "Cadastre uma loja antes do onboarding Stripe")

    store = dict(store)
    account_id = store.get("stripe_account_id")
    connect_api = "v1"
    default_refresh, default_return = _payments_return_urls(settings)
    refresh = refresh_url or default_refresh
    ret = return_url or default_return

    if not account_id:
        contact_email = await _owner_contact_email(session, owner_id, str(store["name"]))
        try:
            if _prefer_accounts_v2():
                try:
                    account_id = _create_connected_account_v2(
                        client,
                        display_name=str(store["name"]),
                        contact_email=contact_email,
                        store_id=str(store["id"]),
                        owner_id=owner_id,
                    )
                    connect_api = "v2"
                except Exception as v2_exc:
                    logger.warning("stripe_v2_account_create_fallback", error=str(v2_exc))
                    account_id = _create_connected_account_v1(
                        display_name=str(store["name"]),
                        store_id=str(store["id"]),
                        owner_id=owner_id,
                        store_slug=str(store.get("slug") or store["id"]),
                        base_url=base_url,
                    )
                    connect_api = "v1"
            else:
                account_id = _create_connected_account_v1(
                    display_name=str(store["name"]),
                    store_id=str(store["id"]),
                    owner_id=owner_id,
                    store_slug=str(store.get("slug") or store["id"]),
                    base_url=base_url,
                )
                connect_api = "v1"

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

    link_payload = await create_account_onboarding_link(
        session,
        owner_id,
        str(account_id),
        refresh_url=refresh,
        return_url=ret,
        prefer_v2=(connect_api == "v2") or _prefer_accounts_v2(),
    )

    return {
        "store_id": str(store["id"]),
        "onboarding_url": link_payload["onboarding_url"],
        "onboarding_expires_at": link_payload["onboarding_expires_at"],
        "stripe_account_id": account_id,
        "connect_api": link_payload.get("connect_api", connect_api),
    }


async def sync_merchant_kyc_for_owner(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    """Sincroniza kyc_status com Stripe após retorno do onboarding (return_url)."""
    store = await get_owner_store(session, owner_id)
    if not store:
        return {"synced": False, "reason": "no_store", "kyc_status": None}
    return await refresh_connect_status(session, str(store["id"]), owner_id)


def _stripe_account_flag(account: Any, key: str) -> bool:
    """Stripe SDK 15+ Account não expõe .get(); usa attr / indexação."""
    if isinstance(account, dict):
        return bool(account.get(key))
    val = getattr(account, key, None)
    if val is None:
        try:
            val = account[key]  # type: ignore[index]
        except Exception:
            val = None
    return bool(val)


def _stripe_account_as_dict(account: Any) -> dict[str, Any]:
    if isinstance(account, dict):
        return account
    to_dict = getattr(account, "to_dict", None)
    if callable(to_dict):
        try:
            return dict(to_dict())
        except Exception:
            pass
    try:
        return dict(account)
    except Exception:
        return {
            "id": getattr(account, "id", None),
            "charges_enabled": getattr(account, "charges_enabled", False),
            "payouts_enabled": getattr(account, "payouts_enabled", False),
            "details_submitted": getattr(account, "details_submitted", False),
            "requirements": getattr(account, "requirements", None),
        }


def _v2_account_ready(v2_acct: Any) -> bool:
    """Inferir onboarding completo via Accounts V2 (requirements + merchant)."""
    req = getattr(v2_acct, "requirements", None)
    entries = getattr(req, "entries", None) if req is not None else None
    if entries:
        return False
    cfg = getattr(v2_acct, "configuration", None)
    merchant = getattr(cfg, "merchant", None) if cfg is not None else None
    if merchant is not None and getattr(merchant, "applied", None) is False:
        return False
    caps = getattr(merchant, "capabilities", None) if merchant is not None else None
    card = getattr(caps, "card_payments", None) if caps is not None else None
    status = getattr(card, "status", None) if card is not None else None
    if status and str(status).lower() not in {"active", "pending"}:
        # pending ainda pode cobrar em test; só bloqueia disabled/inactive
        if str(status).lower() in {"inactive", "disabled", "unrequested"}:
            return False
    return True


async def refresh_connect_status(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    settings = get_settings()
    _init_stripe(settings)
    client = _stripe_client(settings)

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

    account: Any = None
    used_v2 = False
    retrieve_errors: list[str] = []

    # Preferir V2 quando a plataforma opera em Accounts V2 (evita AttributeError no SDK 15).
    if _prefer_accounts_v2():
        try:
            v2_acct = client.v2.core.accounts.retrieve(
                str(account_id),
                {
                    "include": [
                        "configuration.merchant",
                        "configuration.recipient",
                        "requirements",
                        "identity",
                    ]
                },
            )
            ready = _v2_account_ready(v2_acct)
            account = {
                "id": str(account_id),
                "charges_enabled": ready,
                "payouts_enabled": ready,
                "details_submitted": ready,
                "_v2": True,
            }
            used_v2 = True
            logger.info("stripe_v2_account_retrieve_ok", account=account_id, ready=ready)
        except Exception as v2_exc:
            retrieve_errors.append(f"v2:{v2_exc}")
            logger.warning("stripe_v2_account_retrieve_failed", error=str(v2_exc))

    if account is None:
        try:
            account = stripe.Account.retrieve(str(account_id))
        except Exception as v1_exc:
            retrieve_errors.append(f"v1:{v1_exc}")
            logger.error("stripe_account_retrieve_failed", errors=retrieve_errors)
            raise HTTPException(
                400,
                f"Não foi possível ler a conta Stripe ({account_id}): {v1_exc}",
            ) from v1_exc

    complete = bool(
        _stripe_account_flag(account, "charges_enabled")
        and _stripe_account_flag(account, "payouts_enabled")
        and _stripe_account_flag(account, "details_submitted")
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

    if used_v2 or (isinstance(account, dict) and account.get("_v2")):
        kyc_status, reason = ("verified", None) if complete else ("pending", "awaiting_v2_requirements")
    else:
        kyc_status, reason = stripe_account_to_kyc_status(_stripe_account_as_dict(account))
    try:
        await update_merchant_kyc_from_stripe(
            session,
            stripe_account_id=str(account_id),
            kyc_status=kyc_status,
            rejection_reason=reason,
            metadata={"source": "refresh_connect_status"},
        )
    except Exception as kyc_exc:
        logger.warning("refresh_connect_kyc_sync_failed", error=str(kyc_exc), account=account_id)
    return {
        "complete": complete,
        "shop_enabled": complete or store.get("shop_enabled"),
        "kyc_status": kyc_status,
        "connect_api": "v2" if used_v2 else "v1",
    }
