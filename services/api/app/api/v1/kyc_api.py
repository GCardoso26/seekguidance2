"""API — CPF jogador e KYC lojista."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.kyc.merchant_kyc import create_merchant_profile, get_merchant_profile
from app.kyc.player_account import get_account_status, verify_and_bind_cpf
from app.marketplace import shop_connect
from app.marketplace import shop_checkout as shop_checkout_svc
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

router = APIRouter(tags=["kyc-registration"])


class CpfVerifyBody(BaseModel):
    cpf: str = Field(min_length=11, max_length=14)


class MerchantApplyBody(BaseModel):
    store_id: str | None = None


class CheckoutIntentBody(BaseModel):
    shipping_address: dict[str, Any] | None = None
    checkout_session_id: str | None = None
    use_escrow: bool = False


@router.get("/runtime/judge/account/status")
async def account_status(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    player = await get_account_status(session, user_id)
    merchant = await get_merchant_profile(session, user_id)
    return {
        "player": player,
        "merchant": (
            {
                "kyc_status": merchant.get("kyc_status"),
                "rejection_reason": merchant.get("rejection_reason"),
                "verified_at": merchant.get("verified_at"),
                "can_publish": merchant.get("kyc_status") == "verified",
                "onboarding_url": merchant.get("onboarding_url"),
                "onboarding_expires_at": (
                    merchant["onboarding_expires_at"].isoformat()
                    if hasattr(merchant.get("onboarding_expires_at"), "isoformat")
                    else merchant.get("onboarding_expires_at")
                ),
            }
            if merchant
            else None
        ),
    }


@router.post("/runtime/judge/account/cpf")
async def verify_cpf(
    session: DbSession,
    body: CpfVerifyBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await verify_and_bind_cpf(session, user_id, body.cpf)


@router.post("/runtime/judge/merchant/apply")
async def merchant_apply(
    session: DbSession,
    body: MerchantApplyBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    profile = await create_merchant_profile(session, user_id, store_id=body.store_id)
    return {"merchant_profile": profile}


@router.post("/runtime/judge/merchant/onboarding")
async def merchant_onboarding(
    session: DbSession,
    body: MerchantApplyBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    await create_merchant_profile(session, user_id, store_id=body.store_id, require_cpf=False)
    existing = await get_merchant_profile(session, user_id)
    if existing and existing.get("kyc_status") in ("rejected", "restricted"):
        link = await shop_connect.force_refresh_onboarding_link(session, user_id, existing)
        return {
            "store_id": body.store_id,
            "onboarding_url": link["onboarding_url"],
            "onboarding_expires_at": link["onboarding_expires_at"],
            "stripe_account_id": existing.get("provider_account_id"),
        }
    link = await shop_connect.start_connect_onboarding(session, user_id, store_id=body.store_id)
    if link.get("stripe_account_id"):
        await session.execute(
            text(
                """
                UPDATE tcg_judge.merchant_profiles
                SET provider_account_id = :aid,
                    onboarding_url = COALESCE(:url, onboarding_url),
                    onboarding_expires_at = COALESCE(CAST(:exp AS timestamptz), onboarding_expires_at),
                    updated_at = NOW()
                WHERE user_id = :uid
                """
            ),
            {
                "aid": link["stripe_account_id"],
                "url": link.get("onboarding_url"),
                "exp": link.get("onboarding_expires_at"),
                "uid": user_id,
            },
        )
        await session.commit()
    return link


@router.get("/runtime/judge/merchant/onboarding/status")
async def merchant_onboarding_status(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    """Status KYC + regeneração automática do link de onboarding se expirado."""
    user_id = _require_user(x_judge_user_id)
    merchant = await get_merchant_profile(session, user_id)
    if not merchant:
        return {"has_profile": False, "kyc_status": None, "onboarding_url": None}

    if str(merchant.get("user_id")) != user_id:
        raise HTTPException(403, detail="Acesso negado ao perfil lojista")

    status_payload = await shop_connect.refresh_onboarding_link_if_expired(session, user_id, merchant)
    return {
        "has_profile": True,
        "kyc_status": status_payload.get("kyc_status"),
        "rejection_reason": merchant.get("rejection_reason"),
        "can_publish": status_payload.get("kyc_status") == "verified",
        "onboarding_url": status_payload.get("onboarding_url"),
        "onboarding_expires_at": status_payload.get("onboarding_expires_at"),
        "link_refreshed": status_payload.get("refreshed", False),
    }


@router.post("/runtime/judge/checkout/intent")
async def checkout_payment_intent(
    session: DbSession,
    body: CheckoutIntentBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    """PaymentIntent Stripe Connect com application_fee + transfer_data (loja única)."""
    user_id = _require_user(x_judge_user_id)
    return await shop_checkout_svc.create_checkout(
        session,
        user_id,
        shipping_address=body.shipping_address,
        checkout_session_id=body.checkout_session_id,
        use_escrow=body.use_escrow,
    )
