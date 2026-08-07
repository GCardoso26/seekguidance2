"""Dashboards + financial marts."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.financial_platform.adapters.rc1_wallet import list_recent_bp1_ledger
from app.financial_platform.services.ledger_wallet import TransactionService, WalletFacadeService
from app.financial_platform.services.money_engines import (
    CashbackService,
    EscrowService,
    PayoutService,
    SettlementService,
    StoreCreditService,
)


class MartService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def financial_health(self, subject_type: str, subject_id: str) -> dict[str, Any]:
        try:
            row = (
                await self.session.execute(
                    text(
                        """
                        SELECT health_score, factors, snapshot_at::text
                        FROM tcg_judge.mart_financial_health
                        WHERE subject_type = :st AND subject_id = :sid
                        """
                    ),
                    {"st": subject_type, "sid": subject_id},
                )
            ).mappings().first()
            if row:
                return dict(row) | {"subject_type": subject_type, "subject_id": subject_id}
        except Exception:
            pass
        return {
            "subject_type": subject_type,
            "subject_id": subject_id,
            "health_score": 50,
            "factors": {"baseline": True},
            "source": "heuristic_stub",
        }

    async def revenue(self) -> dict[str, Any]:
        try:
            rows = (
                await self.session.execute(
                    text(
                        """
                        SELECT day::text, gmv_cents, fee_cents
                        FROM tcg_judge.mart_revenue
                        ORDER BY day DESC LIMIT 30
                        """
                    )
                )
            ).mappings().all()
            return {"days": [dict(r) for r in rows]}
        except Exception:
            return {"days": [], "source": "empty_mart"}


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def buyer(self, user_id: str) -> dict[str, Any]:
        wallet = await WalletFacadeService(self.session).get_buckets(
            owner_type="buyer", owner_id=user_id
        )
        return {
            "wallet": wallet.to_dict(),
            "cashback": await CashbackService(self.session).balance(user_id),
            "store_credit": await StoreCreditService(self.session).balance(user_id),
            "recent_ledger": await list_recent_bp1_ledger(self.session, user_id),
            "gift_cards": {"note": "redeem via code; non-transferable"},
        }

    async def seller(self, store_id: str) -> dict[str, Any]:
        settlements = await SettlementService(self.session).list_for_store(store_id)
        payouts = await PayoutService(self.session).list_for_store(store_id)
        escrow = await EscrowService(self.session).list_for_store(store_id, 20)
        return {
            "store_id": store_id,
            "settlements": settlements,
            "payouts": payouts,
            "escrow": escrow,
            "pending": {"payouts": sum(1 for p in payouts if p.get("status") == "pending")},
        }

    async def marketplace(self) -> dict[str, Any]:
        mart = MartService(self.session)
        return {
            "gmv": await mart.revenue(),
            "financial_health": await mart.financial_health("platform", "platform"),
            "escrow": await EscrowService(self.session).list_all(10),
            "chargebacks_note": "see /runtime/judge/financial-platform/chargebacks",
        }

    async def financial_dashboard(
        self,
        *,
        user_id: str | None,
        store_id: str | None,
        include_marketplace: bool = False,
    ) -> dict[str, Any]:
        out: dict[str, Any] = {}
        if include_marketplace:
            out["marketplace"] = await self.marketplace()
        if user_id:
            out["buyer"] = await self.buyer(user_id)
            out["transactions"] = await TransactionService(self.session).list_for_subject(
                "buyer", user_id
            )
        if store_id:
            out["seller"] = await self.seller(store_id)
        return out
