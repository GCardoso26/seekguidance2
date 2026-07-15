"""Escrow, Split, Settlement, Payout, Credits, Cashback, Gift, Refund, Chargeback, Policy."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.financial_platform.adapters.rc1_escrow import list_escrow_transactions
from app.financial_platform.adapters.rc1_ledger import list_chargebacks, list_settlements
from app.financial_platform.domain.enums import (
    CHARGEBACK_TRANSITIONS,
    ESCROW_TRANSITIONS,
    PAYOUT_TRANSITIONS,
    REFUND_TRANSITIONS,
    ChargebackStatus,
    EscrowStatus,
    GiftCardType,
    PayoutStatus,
    RefundStatus,
    SplitBeneficiary,
)
from app.financial_platform.observability import emit
from app.financial_platform.security import new_correlation_id, require_fresh_idempotency, write_audit


class EscrowService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def can_transition(self, cur: EscrowStatus, nxt: EscrowStatus) -> bool:
        return nxt in ESCROW_TRANSITIONS.get(cur, frozenset())

    async def create(
        self, *, amount_cents: int, order_ref: str | None = None, rc1_escrow_id: str | None = None
    ) -> dict[str, Any]:
        eid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_escrow_cases (
                  id, order_ref, rc1_escrow_id, amount_cents, status
                ) VALUES (CAST(:id AS uuid), :oref, :rc1, :amt, 'held')
                """
            ),
            {"id": eid, "oref": order_ref, "rc1": rc1_escrow_id, "amt": amount_cents},
        )
        await self.session.commit()
        emit("escrow_created", {"escrow_id": eid, "amount_cents": amount_cents})
        return {"id": eid, "status": EscrowStatus.HELD.value, "amount_cents": amount_cents}

    async def transition(self, escrow_id: str, to_status: EscrowStatus) -> dict[str, Any]:
        row = (
            await self.session.execute(
                text(
                    "SELECT id::text, status FROM tcg_judge.fin_escrow_cases WHERE id = CAST(:id AS uuid)"
                ),
                {"id": escrow_id},
            )
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="escrow_not_found")
        cur = EscrowStatus(row["status"])
        if not self.can_transition(cur, to_status):
            raise HTTPException(status_code=400, detail=f"invalid_escrow_transition:{cur}->{to_status}")
        extra = ", released_at = NOW()" if to_status == EscrowStatus.RELEASED else ""
        await self.session.execute(
            text(
                f"""
                UPDATE tcg_judge.fin_escrow_cases
                SET status = :st, updated_at = NOW(){extra}
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"st": to_status.value, "id": escrow_id},
        )
        await self.session.commit()
        if to_status == EscrowStatus.RELEASED:
            emit("escrow_released", {"escrow_id": escrow_id})
        return {"id": escrow_id, "status": to_status.value}

    async def list_all(self, limit: int = 50) -> dict[str, Any]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, order_ref, amount_cents, status, created_at::text
                    FROM tcg_judge.fin_escrow_cases
                    ORDER BY created_at DESC LIMIT :lim
                    """
                ),
                {"lim": limit},
            )
        ).mappings().all()
        legacy = await list_escrow_transactions(self.session, limit)
        return {"cases": [dict(r) for r in rows], "rc1_projection": legacy}


class SplitService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_rule(
        self,
        *,
        name: str,
        lines: list[dict[str, Any]],
        scope_type: str = "store",
        scope_id: str | None = None,
    ) -> dict[str, Any]:
        if not lines:
            raise HTTPException(status_code=400, detail="split_lines_required")
        total_bps = sum(int(ln.get("percent_bps") or 0) for ln in lines)
        if total_bps > 10000:
            raise HTTPException(status_code=400, detail="split_bps_exceeds_100_percent")
        rid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_split_rules (id, name, scope_type, scope_id)
                VALUES (CAST(:id AS uuid), :name, :st, :sid)
                """
            ),
            {"id": rid, "name": name, "st": scope_type, "sid": scope_id},
        )
        for i, ln in enumerate(lines):
            SplitBeneficiary(ln["beneficiary"])  # validate
            await self.session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.fin_split_lines (
                      rule_id, beneficiary, percent_bps, fixed_cents, sort_order
                    ) VALUES (CAST(:rid AS uuid), :ben, :bps, :fixed, :ord)
                    """
                ),
                {
                    "rid": rid,
                    "ben": ln["beneficiary"],
                    "bps": int(ln.get("percent_bps") or 0),
                    "fixed": int(ln.get("fixed_cents") or 0),
                    "ord": i,
                },
            )
        await self.session.commit()
        emit("split_created", {"rule_id": rid})
        return {"rule_id": rid, "name": name, "lines": lines}

    def apply(self, amount_cents: int, lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
        out = []
        allocated = 0
        for ln in lines[:-1]:
            part = amount_cents * int(ln.get("percent_bps") or 0) // 10000 + int(ln.get("fixed_cents") or 0)
            allocated += part
            out.append({**ln, "amount_cents": part})
        if lines:
            last = lines[-1]
            out.append({**last, "amount_cents": max(0, amount_cents - allocated) + int(last.get("fixed_cents") or 0)})
        return out


class SettlementService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def open_run(self, store_id: str | None = None) -> dict[str, Any]:
        rid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_settlement_runs (id, store_id, status)
                VALUES (CAST(:id AS uuid), :sid, 'open')
                """
            ),
            {"id": rid, "sid": store_id},
        )
        await self.session.commit()
        return {"id": rid, "status": "open", "store_id": store_id}

    async def close(self, run_id: str) -> dict[str, Any]:
        await self.session.execute(
            text(
                """
                UPDATE tcg_judge.fin_settlement_runs
                SET status = 'closed', closed_at = NOW()
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"id": run_id},
        )
        await self.session.commit()
        emit("settlement_completed", {"run_id": run_id})
        return {"id": run_id, "status": "closed"}

    async def list_all(self, limit: int = 50) -> dict[str, Any]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_id, status, total_cents, created_at::text
                    FROM tcg_judge.fin_settlement_runs
                    ORDER BY created_at DESC LIMIT :lim
                    """
                ),
                {"lim": limit},
            )
        ).mappings().all()
        return {
            "runs": [dict(r) for r in rows],
            "rc1_projection": await list_settlements(self.session, limit),
        }


class PayoutService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def can_transition(self, cur: PayoutStatus, nxt: PayoutStatus) -> bool:
        return nxt in PAYOUT_TRANSITIONS.get(cur, frozenset())

    async def request(
        self,
        *,
        store_id: str,
        amount_cents: int,
        idempotency_key: str,
    ) -> dict[str, Any]:
        await require_fresh_idempotency(self.session, "fin_payout_requests", idempotency_key)
        # Policy min check
        pol = (
            await self.session.execute(
                text("SELECT payout_min_cents FROM tcg_judge.fin_store_policies WHERE store_id = :s"),
                {"s": store_id},
            )
        ).mappings().first()
        min_cents = int(pol["payout_min_cents"]) if pol else 5000
        if amount_cents < min_cents:
            raise HTTPException(status_code=400, detail=f"below_payout_minimum:{min_cents}")
        pid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_payout_requests (
                  id, store_id, amount_cents, status, idempotency_key
                ) VALUES (CAST(:id AS uuid), :sid, :amt, 'pending', :ikey)
                """
            ),
            {"id": pid, "sid": store_id, "amt": amount_cents, "ikey": idempotency_key},
        )
        await write_audit(
            self.session,
            action="payout_requested",
            actor_id=None,
            correlation_id=new_correlation_id(),
            payload={"payout_id": pid, "store_id": store_id},
        )
        await self.session.commit()
        emit("payout_requested", {"payout_id": pid})
        return {
            "id": pid,
            "status": PayoutStatus.PENDING.value,
            "amount_cents": amount_cents,
            "stripe_connect": "prepared_stub",
        }

    async def advance(self, payout_id: str, to_status: PayoutStatus) -> dict[str, Any]:
        row = (
            await self.session.execute(
                text("SELECT status FROM tcg_judge.fin_payout_requests WHERE id = CAST(:id AS uuid)"),
                {"id": payout_id},
            )
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="payout_not_found")
        cur = PayoutStatus(row["status"])
        if not self.can_transition(cur, to_status):
            raise HTTPException(status_code=400, detail="invalid_payout_transition")
        await self.session.execute(
            text(
                """
                UPDATE tcg_judge.fin_payout_requests
                SET status = :st, updated_at = NOW()
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"st": to_status.value, "id": payout_id},
        )
        await self.session.commit()
        if to_status == PayoutStatus.COMPLETED:
            emit("payout_completed", {"payout_id": payout_id})
        return {"id": payout_id, "status": to_status.value}

    async def list_for_store(self, store_id: str) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, amount_cents, status, created_at::text
                    FROM tcg_judge.fin_payout_requests
                    WHERE store_id = :sid ORDER BY created_at DESC LIMIT 100
                    """
                ),
                {"sid": store_id},
            )
        ).mappings().all()
        return [dict(r) for r in rows]


class StoreCreditService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def issue(
        self, *, owner_id: str, amount_cents: int, store_id: str | None = None, reason: str | None = None
    ) -> dict[str, Any]:
        cid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_store_credits (
                  id, owner_id, store_id, amount_cents, remaining_cents, reason
                ) VALUES (CAST(:id AS uuid), :oid, :sid, :amt, :amt, :reason)
                """
            ),
            {"id": cid, "oid": owner_id, "sid": store_id, "amt": amount_cents, "reason": reason},
        )
        await self.session.commit()
        return {"id": cid, "remaining_cents": amount_cents, "is_cash": False}

    async def balance(self, owner_id: str) -> dict[str, Any]:
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT COALESCE(SUM(remaining_cents), 0)::int AS remaining
                    FROM tcg_judge.fin_store_credits WHERE owner_id = :oid
                    """
                ),
                {"oid": owner_id},
            )
        ).mappings().first()
        return {"owner_id": owner_id, "remaining_cents": int(row["remaining"]) if row else 0}


class CashbackService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_rule(
        self, *, name: str, scope_type: str, percent_bps: int, scope_id: str | None = None
    ) -> dict[str, Any]:
        rid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_cashback_rules (id, name, scope_type, scope_id, percent_bps)
                VALUES (CAST(:id AS uuid), :name, :st, :sid, :bps)
                """
            ),
            {"id": rid, "name": name, "st": scope_type, "sid": scope_id, "bps": percent_bps},
        )
        await self.session.commit()
        return {"id": rid, "name": name, "percent_bps": percent_bps, "checkout_inline": False}

    def compute(self, amount_cents: int, percent_bps: int) -> int:
        """Never call from checkout — engine only."""
        return amount_cents * percent_bps // 10000

    async def grant(self, *, user_id: str, amount_cents: int, rule_id: str | None = None) -> dict[str, Any]:
        cid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_cashback_ledger (id, user_id, rule_id, amount_cents, status)
                VALUES (
                  CAST(:id AS uuid), :uid,
                  CASE WHEN :rid IS NULL THEN NULL ELSE CAST(:rid AS uuid) END,
                  :amt, 'available'
                )
                """
            ),
            {"id": cid, "uid": user_id, "rid": rule_id, "amt": amount_cents},
        )
        await self.session.commit()
        emit("cashback_generated", {"user_id": user_id, "amount_cents": amount_cents})
        return {"id": cid, "amount_cents": amount_cents}

    async def balance(self, user_id: str) -> dict[str, Any]:
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT COALESCE(SUM(amount_cents), 0)::int AS available
                    FROM tcg_judge.fin_cashback_ledger
                    WHERE user_id = :uid AND status = 'available'
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        return {"user_id": user_id, "available_cents": int(row["available"]) if row else 0}


class GiftCardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def issue(
        self,
        *,
        amount_cents: int,
        card_type: GiftCardType = GiftCardType.MARKETPLACE,
        store_id: str | None = None,
    ) -> dict[str, Any]:
        if amount_cents <= 0:
            raise HTTPException(status_code=400, detail="invalid_amount")
        code = secrets.token_urlsafe(12)
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        gid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_gift_cards (
                  id, code_hash, card_type, store_id, amount_cents, remaining_cents, transferable
                ) VALUES (
                  CAST(:id AS uuid), :ch, :ct, :sid, :amt, :amt, FALSE
                )
                """
            ),
            {
                "id": gid,
                "ch": code_hash,
                "ct": card_type.value,
                "sid": store_id,
                "amt": amount_cents,
            },
        )
        await self.session.commit()
        emit("giftcard_created", {"gift_card_id": gid})
        return {
            "id": gid,
            "code": code,
            "amount_cents": amount_cents,
            "transferable": False,
        }

    async def redeem(self, *, code: str, amount_cents: int) -> dict[str, Any]:
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, remaining_cents, status, transferable
                    FROM tcg_judge.fin_gift_cards WHERE code_hash = :ch LIMIT 1
                    """
                ),
                {"ch": code_hash},
            )
        ).mappings().first()
        if not row or row["status"] != "active":
            raise HTTPException(status_code=404, detail="gift_card_not_found")
        rem = int(row["remaining_cents"])
        if amount_cents > rem:
            raise HTTPException(status_code=400, detail="insufficient_gift_balance")
        new_rem = rem - amount_cents
        status = "redeemed" if new_rem == 0 else "active"
        await self.session.execute(
            text(
                """
                UPDATE tcg_judge.fin_gift_cards
                SET remaining_cents = :rem, status = :st
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"rem": new_rem, "st": status, "id": row["id"]},
        )
        await self.session.commit()
        emit("giftcard_used", {"gift_card_id": row["id"], "amount_cents": amount_cents})
        return {"id": row["id"], "remaining_cents": new_rem, "status": status}

    def transfer_forbidden(self) -> None:
        raise HTTPException(status_code=400, detail="gift_card_transfer_forbidden")


class RefundService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def can_transition(self, cur: RefundStatus, nxt: RefundStatus) -> bool:
        return nxt in REFUND_TRANSITIONS.get(cur, frozenset())

    async def request(
        self, *, amount_cents: int, idempotency_key: str, order_ref: str | None = None, actor_id: str | None = None
    ) -> dict[str, Any]:
        await require_fresh_idempotency(self.session, "fin_refund_cases", idempotency_key)
        rid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_refund_cases (
                  id, order_ref, amount_cents, status, actor_id, idempotency_key
                ) VALUES (CAST(:id AS uuid), :oref, :amt, 'requested', :actor, :ikey)
                """
            ),
            {
                "id": rid,
                "oref": order_ref,
                "amt": amount_cents,
                "actor": actor_id,
                "ikey": idempotency_key,
            },
        )
        await self.session.commit()
        emit("refund_requested", {"refund_id": rid})
        return {"id": rid, "status": RefundStatus.REQUESTED.value}

    async def advance(self, refund_id: str, to_status: RefundStatus) -> dict[str, Any]:
        row = (
            await self.session.execute(
                text("SELECT status FROM tcg_judge.fin_refund_cases WHERE id = CAST(:id AS uuid)"),
                {"id": refund_id},
            )
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="refund_not_found")
        cur = RefundStatus(row["status"])
        if not self.can_transition(cur, to_status):
            raise HTTPException(status_code=400, detail="invalid_refund_transition")
        await self.session.execute(
            text(
                """
                UPDATE tcg_judge.fin_refund_cases SET status = :st, updated_at = NOW()
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"st": to_status.value, "id": refund_id},
        )
        await self.session.commit()
        if to_status == RefundStatus.EXECUTED:
            emit("refund_completed", {"refund_id": refund_id})
        return {"id": refund_id, "status": to_status.value}


class ChargebackService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def can_transition(self, cur: ChargebackStatus, nxt: ChargebackStatus) -> bool:
        return nxt in CHARGEBACK_TRANSITIONS.get(cur, frozenset())

    async def receive(self, *, amount_cents: int, psp_dispute_id: str | None = None) -> dict[str, Any]:
        cid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_chargeback_cases (
                  id, psp_dispute_id, amount_cents, status
                ) VALUES (CAST(:id AS uuid), :psp, :amt, 'received')
                """
            ),
            {"id": cid, "psp": psp_dispute_id, "amt": amount_cents},
        )
        await self.session.commit()
        emit("chargeback_received", {"chargeback_id": cid})
        return {"id": cid, "status": ChargebackStatus.RECEIVED.value}

    async def list_all(self, limit: int = 50) -> dict[str, Any]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, status, amount_cents, created_at::text
                    FROM tcg_judge.fin_chargeback_cases
                    ORDER BY created_at DESC LIMIT :lim
                    """
                ),
                {"lim": limit},
            )
        ).mappings().all()
        return {
            "cases": [dict(r) for r in rows],
            "rc1_projection": await list_chargebacks(self.session, limit),
        }


class CommissionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_rule(
        self, *, fee_type: str, percent_bps: int, scope_type: str = "global", scope_id: str | None = None
    ) -> dict[str, Any]:
        rid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_commission_rules (
                  id, fee_type, scope_type, scope_id, percent_bps
                ) VALUES (CAST(:id AS uuid), :ft, :st, :sid, :bps)
                """
            ),
            {"id": rid, "ft": fee_type, "st": scope_type, "sid": scope_id, "bps": percent_bps},
        )
        await self.session.commit()
        return {"id": rid, "fee_type": fee_type, "percent_bps": percent_bps}

    def compute(self, amount_cents: int, percent_bps: int, fixed_cents: int = 0) -> int:
        return amount_cents * percent_bps // 10000 + fixed_cents


class PolicyService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_or_default(self, store_id: str) -> dict[str, Any]:
        row = (
            await self.session.execute(
                text("SELECT * FROM tcg_judge.fin_store_policies WHERE store_id = :s"),
                {"s": store_id},
            )
        ).mappings().first()
        if row:
            return dict(row)
        return {
            "store_id": store_id,
            "payout_delay_days": 7,
            "payout_min_cents": 5000,
            "allow_wallet": False,
            "allow_counter": True,
            "allow_installments": False,
            "checkout_mutated": False,
        }

    async def upsert(self, store_id: str, patch: dict[str, Any]) -> dict[str, Any]:
        current = await self.get_or_default(store_id)
        merged = {**current, **patch, "store_id": store_id}
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_store_policies (
                  store_id, payout_delay_days, payout_min_cents, allow_wallet,
                  allow_counter, allow_installments
                ) VALUES (
                  :sid, :delay, :minc, :wallet, :counter, :inst
                )
                ON CONFLICT (store_id) DO UPDATE SET
                  payout_delay_days = EXCLUDED.payout_delay_days,
                  payout_min_cents = EXCLUDED.payout_min_cents,
                  allow_wallet = EXCLUDED.allow_wallet,
                  allow_counter = EXCLUDED.allow_counter,
                  allow_installments = EXCLUDED.allow_installments,
                  updated_at = NOW()
                """
            ),
            {
                "sid": store_id,
                "delay": int(merged.get("payout_delay_days") or 7),
                "minc": int(merged.get("payout_min_cents") or 5000),
                "wallet": bool(merged.get("allow_wallet")),
                "counter": bool(merged.get("allow_counter", True)),
                "inst": bool(merged.get("allow_installments")),
            },
        )
        await self.session.commit()
        return await self.get_or_default(store_id)


class BillingFacade:
    """Read BP1 subscriptions — does not rewrite Stripe Billing."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def plans_for_user(self, user_id: str) -> dict[str, Any]:
        try:
            from app.identity_platform.services import SubscriptionService

            return await SubscriptionService(self.session).list_for_user(user_id)
        except Exception:
            return {
                "subscriptions": [],
                "available_plans": [
                    "FREE",
                    "PRO",
                    "SELLER_STARTER",
                    "SELLER_PRO",
                    "ENTERPRISE",
                ],
            }
