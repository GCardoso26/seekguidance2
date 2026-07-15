"""Ledger double-entry, Wallet facade, Transaction engine."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.financial_platform.adapters.rc1_wallet import read_bp1_wallet_buckets
from app.financial_platform.domain import JournalLine, PostedJournal, WalletBuckets
from app.financial_platform.domain.enums import AccountType, OwnerType, TxnType
from app.financial_platform.observability import emit
from app.financial_platform.security import (
    assert_balanced,
    new_correlation_id,
    require_fresh_idempotency,
    write_audit,
)


class LedgerService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def ensure_account(
        self,
        *,
        code: str,
        name: str,
        owner_type: OwnerType,
        owner_id: str,
        account_type: AccountType,
        currency: str = "BRL",
    ) -> str:
        row = (
            await self.session.execute(
                text("SELECT id::text FROM tcg_judge.fin_accounts WHERE code = :code LIMIT 1"),
                {"code": code},
            )
        ).mappings().first()
        if row:
            return row["id"]
        aid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_accounts (
                  id, code, name, owner_type, owner_id, account_type, currency
                ) VALUES (
                  CAST(:id AS uuid), :code, :name, :ot, :oid, :at, :cur
                )
                ON CONFLICT (code) DO NOTHING
                """
            ),
            {
                "id": aid,
                "code": code,
                "name": name,
                "ot": owner_type.value,
                "oid": owner_id,
                "at": account_type.value,
                "cur": currency,
            },
        )
        await self.session.flush()
        row2 = (
            await self.session.execute(
                text("SELECT id::text FROM tcg_judge.fin_accounts WHERE code = :code LIMIT 1"),
                {"code": code},
            )
        ).mappings().first()
        return row2["id"] if row2 else aid

    async def account_balance_cents(self, account_id: str) -> int:
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT COALESCE(SUM(debit_cents), 0) - COALESCE(SUM(credit_cents), 0) AS bal
                    FROM tcg_judge.fin_journal_entries
                    WHERE account_id = CAST(:id AS uuid)
                    """
                ),
                {"id": account_id},
            )
        ).mappings().first()
        return int(row["bal"]) if row else 0

    async def post_journal(
        self,
        *,
        idempotency_key: str,
        txn_type: TxnType | str,
        lines: list[JournalLine],
        actor_id: str | None = None,
        correlation_id: str | None = None,
        memo: str | None = None,
        source: str = "financial_platform",
    ) -> PostedJournal:
        await require_fresh_idempotency(self.session, "fin_journals", idempotency_key)
        if len(lines) < 2:
            raise HTTPException(status_code=400, detail="journal_needs_at_least_two_lines")
        assert_balanced([(ln.debit_cents, ln.credit_cents) for ln in lines])
        corr = correlation_id or new_correlation_id()
        jid = str(uuid.uuid4())
        ttype = txn_type.value if isinstance(txn_type, TxnType) else str(txn_type)
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_journals (
                  id, idempotency_key, correlation_id, actor_id, source, txn_type, memo
                ) VALUES (
                  CAST(:id AS uuid), :ikey, :corr, :actor, :source, :ttype, :memo
                )
                """
            ),
            {
                "id": jid,
                "ikey": idempotency_key,
                "corr": corr,
                "actor": actor_id,
                "source": source,
                "ttype": ttype,
                "memo": memo,
            },
        )
        for ln in lines:
            acc = (
                await self.session.execute(
                    text("SELECT id::text FROM tcg_judge.fin_accounts WHERE code = :c LIMIT 1"),
                    {"c": ln.account_code},
                )
            ).mappings().first()
            if not acc:
                raise HTTPException(status_code=400, detail=f"unknown_account:{ln.account_code}")
            await self.session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.fin_journal_entries (
                      journal_id, account_id, debit_cents, credit_cents
                    ) VALUES (
                      CAST(:jid AS uuid), CAST(:aid AS uuid), :d, :c
                    )
                    """
                ),
                {
                    "jid": jid,
                    "aid": acc["id"],
                    "d": ln.debit_cents,
                    "c": ln.credit_cents,
                },
            )
        await write_audit(
            self.session,
            action="journal_posted",
            actor_id=actor_id,
            correlation_id=corr,
            ledger_journal_id=jid,
            payload={"txn_type": ttype, "lines": len(lines)},
        )
        await self.session.commit()
        emit("wallet_transaction", {"journal_id": jid, "txn_type": ttype})
        return PostedJournal(
            id=jid,
            idempotency_key=idempotency_key,
            correlation_id=corr,
            txn_type=ttype,
            lines=lines,
        )


class WalletFacadeService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.ledger = LedgerService(session)

    async def ensure_subject_accounts(
        self, *, owner_type: OwnerType, owner_id: str
    ) -> dict[str, str]:
        prefix = f"{owner_type.value}:{owner_id}"
        cash = await self.ledger.ensure_account(
            code=f"{prefix}:cash",
            name=f"{owner_type.value} cash",
            owner_type=owner_type,
            owner_id=owner_id,
            account_type=AccountType.ASSET,
        )
        liability = await self.ledger.ensure_account(
            code=f"{prefix}:wallet_liability",
            name=f"{owner_type.value} wallet liability",
            owner_type=owner_type,
            owner_id=owner_id,
            account_type=AccountType.LIABILITY,
        )
        await self.session.commit()
        emit("wallet_created", {"owner_type": owner_type.value, "owner_id": owner_id})
        return {"cash": cash, "wallet_liability": liability, "prefix": prefix}

    async def get_buckets(self, *, owner_type: str, owner_id: str) -> WalletBuckets:
        buckets = await read_bp1_wallet_buckets(
            self.session, owner_type=owner_type, owner_id=owner_id
        )
        # Overlay fin store credits
        try:
            row = (
                await self.session.execute(
                    text(
                        """
                        SELECT COALESCE(SUM(remaining_cents), 0)::int AS total
                        FROM tcg_judge.fin_store_credits
                        WHERE owner_id = :oid
                        """
                    ),
                    {"oid": owner_id},
                )
            ).mappings().first()
            if row and int(row["total"]) > 0:
                buckets.store_credit_cents = max(buckets.store_credit_cents, int(row["total"]))
        except Exception:
            pass
        try:
            row = (
                await self.session.execute(
                    text(
                        """
                        SELECT COALESCE(SUM(amount_cents), 0)::int AS total
                        FROM tcg_judge.fin_cashback_ledger
                        WHERE user_id = :oid AND status = 'available'
                        """
                    ),
                    {"oid": owner_id},
                )
            ).mappings().first()
            if row:
                buckets.cashback_cents = max(buckets.cashback_cents, int(row["total"]))
        except Exception:
            pass
        return buckets


class TransactionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.ledger = LedgerService(session)
        self.wallet = WalletFacadeService(session)

    async def record(
        self,
        *,
        txn_type: TxnType,
        amount_cents: int,
        idempotency_key: str,
        subject_type: str | None = None,
        subject_id: str | None = None,
        actor_id: str | None = None,
        order_ref: str | None = None,
        debit_account_code: str | None = None,
        credit_account_code: str | None = None,
    ) -> dict[str, Any]:
        await require_fresh_idempotency(self.session, "fin_transactions", idempotency_key)
        if amount_cents <= 0:
            raise HTTPException(status_code=400, detail="amount_must_be_positive")

        # Ensure platform clearing accounts + subject accounts when provided
        await self.ledger.ensure_account(
            code="platform:clearing",
            name="Platform clearing",
            owner_type=OwnerType.PLATFORM,
            owner_id="platform",
            account_type=AccountType.ASSET,
        )
        await self.ledger.ensure_account(
            code="platform:revenue",
            name="Platform revenue",
            owner_type=OwnerType.PLATFORM,
            owner_id="platform",
            account_type=AccountType.REVENUE,
        )
        await self.session.commit()

        debit_code = debit_account_code or "platform:clearing"
        credit_code = credit_account_code or "platform:revenue"
        if subject_type and subject_id:
            ot = OwnerType(subject_type) if subject_type in OwnerType._value2member_map_ else OwnerType.BUYER
            accounts = await self.wallet.ensure_subject_accounts(owner_type=ot, owner_id=subject_id)
            if txn_type in (TxnType.DEPOSIT, TxnType.CASHBACK, TxnType.PRIZE, TxnType.STORE_CREDIT):
                debit_code = "platform:clearing"
                credit_code = f"{accounts['prefix']}:wallet_liability"
            elif txn_type in (TxnType.WITHDRAWAL, TxnType.PURCHASE, TxnType.FEE):
                debit_code = f"{accounts['prefix']}:wallet_liability"
                credit_code = "platform:clearing"

        journal = await self.ledger.post_journal(
            idempotency_key=f"j-{idempotency_key}",
            txn_type=txn_type,
            actor_id=actor_id,
            lines=[
                JournalLine(account_code=debit_code, debit_cents=amount_cents),
                JournalLine(account_code=credit_code, credit_cents=amount_cents),
            ],
        )
        tid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.fin_transactions (
                  id, journal_id, txn_type, amount_cents, subject_type, subject_id,
                  order_ref, status, idempotency_key, correlation_id
                ) VALUES (
                  CAST(:id AS uuid), CAST(:jid AS uuid), :ttype, :amt, :stype, :sid,
                  :oref, 'completed', :ikey, :corr
                )
                """
            ),
            {
                "id": tid,
                "jid": journal.id,
                "ttype": txn_type.value,
                "amt": amount_cents,
                "stype": subject_type,
                "sid": subject_id,
                "oref": order_ref,
                "ikey": idempotency_key,
                "corr": journal.correlation_id,
            },
        )
        await self.session.commit()
        return {
            "transaction_id": tid,
            "journal": journal.to_dict(),
            "amount_cents": amount_cents,
            "txn_type": txn_type.value,
        }

    async def list_for_subject(
        self, subject_type: str, subject_id: str, limit: int = 50
    ) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, txn_type, amount_cents, currency, status,
                           order_ref, created_at::text
                    FROM tcg_judge.fin_transactions
                    WHERE subject_type = :st AND subject_id = :sid
                    ORDER BY created_at DESC
                    LIMIT :lim
                    """
                ),
                {"st": subject_type, "sid": subject_id, "lim": limit},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
