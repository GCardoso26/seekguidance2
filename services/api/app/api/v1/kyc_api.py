"""API — CPF jogador e KYC lojista."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.kyc.merchant_kyc import create_merchant_profile, get_merchant_profile
from app.kyc.player_account import get_account_status, verify_and_bind_cpf
from app.marketplace import shop_connect
from fastapi import APIRouter, Header
from pydantic import BaseModel, Field
from sqlalchemy import text

router = APIRouter(tags=["kyc-registration"])


class CpfVerifyBody(BaseModel):
    cpf: str = Field(min_length=11, max_length=14)


class MerchantApplyBody(BaseModel):
    store_id: str | None = None


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
    await create_merchant_profile(session, user_id, store_id=body.store_id)
    link = await shop_connect.start_connect_onboarding(session, user_id, store_id=body.store_id)
    if link.get("stripe_account_id"):
        await session.execute(
            text(
                """
                UPDATE tcg_judge.merchant_profiles
                SET provider_account_id = :aid, updated_at = NOW()
                WHERE user_id = :uid
                """
            ),
            {"aid": link["stripe_account_id"], "uid": user_id},
        )
        await session.commit()
    return link
