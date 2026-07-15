"""Project BP1 wallets into Financial Platform buckets."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.financial_platform.domain import WalletBuckets
from app.financial_platform.domain.enums import OwnerType


async def read_bp1_wallet_buckets(
    session: AsyncSession, *, owner_type: str, owner_id: str
) -> WalletBuckets:
    try:
        wallet = (
            await session.execute(
                text(
                    """
                    SELECT id::text FROM tcg_judge.wallets
                    WHERE owner_type = :ot AND owner_id = :oid
                    LIMIT 1
                    """
                ),
                {"ot": owner_type if owner_type != "buyer" else "user", "oid": owner_id},
            )
        ).mappings().first()
        if not wallet:
            return WalletBuckets(
                owner_type=OwnerType(owner_type) if owner_type in OwnerType._value2member_map_ else OwnerType.BUYER,
                owner_id=owner_id,
                source="bp1_wallet_missing",
            )
        rows = (
            await session.execute(
                text(
                    """
                    SELECT balance_type, COALESCE(SUM(amount_cents), 0)::int AS total
                    FROM tcg_judge.wallet_ledgers
                    WHERE wallet_id = CAST(:wid AS uuid)
                    GROUP BY balance_type
                    """
                ),
                {"wid": wallet["id"]},
            )
        ).mappings().all()
        by_type = {r["balance_type"]: int(r["total"]) for r in rows}
        return WalletBuckets(
            owner_type=OwnerType.BUYER if owner_type in ("buyer", "user") else OwnerType(owner_type),
            owner_id=owner_id,
            available_cents=by_type.get("balance", 0),
            cashback_cents=by_type.get("cashback", 0),
            credit_cents=by_type.get("credit", 0),
            gift_card_cents=by_type.get("gift_card", 0),
            store_credit_cents=by_type.get("store_credit", 0),
            reserved_cents=0,
            pending_cents=by_type.get("refund", 0),
            source="bp1_wallet_ledgers",
        )
    except Exception:
        return WalletBuckets(
            owner_type=OwnerType.BUYER,
            owner_id=owner_id,
            source="bp1_wallet_error",
        )


async def list_recent_bp1_ledger(session: AsyncSession, user_id: str, limit: int = 20) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT wl.balance_type, wl.amount_cents, wl.currency, wl.created_at::text
                    FROM tcg_judge.wallet_ledgers wl
                    JOIN tcg_judge.wallets w ON w.id = wl.wallet_id
                    WHERE w.owner_type = 'user' AND w.owner_id = :uid
                    ORDER BY wl.created_at DESC
                    LIMIT :lim
                    """
                ),
                {"uid": user_id, "lim": limit},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        return []
