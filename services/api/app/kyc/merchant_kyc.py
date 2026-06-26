"""KYC lojista — merchant_profiles + Stripe Connect."""

from __future__ import annotations

import json
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.kyc.player_account import require_active_account
from app.players.store import ensure_player_profile

logger = structlog.get_logger(__name__)

KYC_STATUSES = frozenset({"pending", "verified", "rejected", "restricted"})


async def _log_merchant_audit(
    session: AsyncSession,
    *,
    user_id: str,
    merchant_id: str,
    old_status: str | None,
    new_status: str,
    reason: str | None = None,
    provider_event_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    if provider_event_id:
        dup = (
            await session.execute(
                text(
                    """
                    SELECT id FROM tcg_judge.kyc_audit_logs
                    WHERE provider_event_id = :evt LIMIT 1
                    """
                ),
                {"evt": provider_event_id},
            )
        ).mappings().first()
        if dup:
            return

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.kyc_audit_logs
              (user_id, merchant_profile_id, entity_type, old_status, new_status,
               reason, provider_event_id, metadata)
            VALUES (:uid, :mid, 'merchant', :old, :new, :reason, :evt, CAST(:meta AS jsonb))
            """
        ),
        {
            "uid": user_id,
            "mid": merchant_id,
            "old": old_status,
            "new": new_status,
            "reason": reason,
            "evt": provider_event_id,
            "meta": json.dumps(metadata or {}),
        },
    )


async def get_merchant_profile(session: AsyncSession, user_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.merchant_profiles WHERE user_id = :uid"),
            {"uid": user_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def create_merchant_profile(
    session: AsyncSession,
    user_id: str,
    *,
    store_id: str | None = None,
) -> dict[str, Any]:
    await ensure_player_profile(session, user_id)
    await require_active_account(session, user_id)

    existing = await get_merchant_profile(session, user_id)
    if existing:
        return existing

    if store_id:
        store = (
            await session.execute(
                text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
                {"id": store_id, "oid": user_id},
            )
        ).mappings().first()
        if not store:
            raise HTTPException(404, "Loja não encontrada")

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.merchant_profiles (user_id, store_id, kyc_status)
                VALUES (:uid, :sid, 'pending')
                RETURNING *
                """
            ),
            {"uid": user_id, "sid": store_id},
        )
    ).mappings().first()
    mp = dict(row) if row else {}
    await _log_merchant_audit(
        session,
        user_id=user_id,
        merchant_id=str(mp.get("id")),
        old_status=None,
        new_status="pending",
        reason="merchant_profile_created",
    )
    await session.commit()
    return mp


async def require_verified_merchant(session: AsyncSession, user_id: str) -> dict[str, Any]:
    mp = await get_merchant_profile(session, user_id)
    if not mp:
        raise HTTPException(
            403,
            detail={
                "code": "merchant_kyc_required",
                "message": "Complete o cadastro de lojista (KYC) para publicar produtos.",
                "kyc_status": None,
            },
        )
    if mp.get("kyc_status") != "verified":
        raise HTTPException(
            403,
            detail={
                "code": "merchant_kyc_required",
                "message": "KYC pendente ou não aprovado.",
                "kyc_status": mp.get("kyc_status"),
                "rejection_reason": mp.get("rejection_reason"),
            },
        )
    return mp


async def update_merchant_kyc_from_stripe(
    session: AsyncSession,
    *,
    stripe_account_id: str,
    kyc_status: str,
    rejection_reason: str | None = None,
    provider_event_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    if kyc_status not in KYC_STATUSES:
        return None

    mp = (
        await session.execute(
            text(
                """
                SELECT mp.*, s.owner_id
                FROM tcg_judge.merchant_profiles mp
                LEFT JOIN tcg_judge.stores s ON s.id = mp.store_id
                WHERE mp.provider_account_id = :aid
                   OR s.stripe_account_id = :aid
                LIMIT 1
                """
            ),
            {"aid": stripe_account_id},
        )
    ).mappings().first()
    if not mp:
        store = (
            await session.execute(
                text("SELECT id, owner_id FROM tcg_judge.stores WHERE stripe_account_id = :aid"),
                {"aid": stripe_account_id},
            )
        ).mappings().first()
        if not store:
            logger.info("stripe_kyc_no_merchant", account=stripe_account_id)
            return None
        await ensure_player_profile(session, str(store["owner_id"]))
        owner_id = str(store["owner_id"])
        mp_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.merchant_profiles
                      (user_id, store_id, kyc_status, provider_account_id, kyc_provider)
                    VALUES (:uid, :sid, :status, :aid, 'stripe')
                    ON CONFLICT (user_id) DO UPDATE SET
                      store_id = COALESCE(merchant_profiles.store_id, EXCLUDED.store_id),
                      provider_account_id = EXCLUDED.provider_account_id,
                      updated_at = NOW()
                    RETURNING *
                    """
                ),
                {
                    "uid": owner_id,
                    "sid": str(store["id"]),
                    "status": kyc_status,
                    "aid": stripe_account_id,
                },
            )
        ).mappings().first()
        if mp_row:
            mp = dict(mp_row)
            mp["owner_id"] = owner_id
    if not mp:
        return None

    old_status = str(mp.get("kyc_status") or "pending")
    if old_status == kyc_status and not rejection_reason:
        return dict(mp)

    verified_at_sql = ", verified_at = NOW()" if kyc_status == "verified" else ", verified_at = NULL"
    updated = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.merchant_profiles
                SET kyc_status = :status,
                    rejection_reason = :reason,
                    provider_account_id = COALESCE(provider_account_id, :aid),
                    updated_at = NOW()
                    {verified_at_sql}
                WHERE id = :id
                RETURNING *
                """
            ),
            {
                "status": kyc_status,
                "reason": rejection_reason,
                "aid": stripe_account_id,
                "id": str(mp["id"]),
            },
        )
    ).mappings().first()

    if kyc_status == "verified":
        await session.execute(
            text(
                """
                UPDATE tcg_judge.stores
                SET stripe_onboarding_complete = true, shop_enabled = true, updated_at = NOW()
                WHERE stripe_account_id = :aid
                """
            ),
            {"aid": stripe_account_id},
        )

    await _log_merchant_audit(
        session,
        user_id=str(mp.get("user_id") or mp.get("owner_id")),
        merchant_id=str(mp["id"]),
        old_status=old_status,
        new_status=kyc_status,
        reason=rejection_reason,
        provider_event_id=provider_event_id,
        metadata=metadata,
    )
    await session.commit()
    return dict(updated) if updated else None


def stripe_account_to_kyc_status(account: dict[str, Any]) -> tuple[str, str | None]:
    """Mapeia objeto Account Stripe → kyc_status interno."""
    disabled_reason = account.get("requirements", {}).get("disabled_reason")
    if account.get("charges_enabled") and account.get("payouts_enabled"):
        return "verified", None
    if disabled_reason and "rejected" in str(disabled_reason):
        return "rejected", str(disabled_reason)
    if disabled_reason:
        return "restricted", str(disabled_reason)
    if account.get("details_submitted"):
        return "pending", "Aguardando verificação Stripe"
    return "pending", None
