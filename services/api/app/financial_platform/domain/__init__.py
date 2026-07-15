"""Domain entities — Financial Platform."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.financial_platform.domain.enums import (
    AccountType,
    EscrowStatus,
    OwnerType,
    PayoutStatus,
    TxnType,
)


@dataclass
class JournalLine:
    account_code: str
    debit_cents: int = 0
    credit_cents: int = 0


@dataclass
class PostedJournal:
    id: str
    idempotency_key: str
    correlation_id: str
    txn_type: str
    lines: list[JournalLine] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "idempotency_key": self.idempotency_key,
            "correlation_id": self.correlation_id,
            "txn_type": self.txn_type,
            "lines": [
                {
                    "account_code": ln.account_code,
                    "debit_cents": ln.debit_cents,
                    "credit_cents": ln.credit_cents,
                }
                for ln in self.lines
            ],
        }


@dataclass
class WalletBuckets:
    owner_type: OwnerType
    owner_id: str
    available_cents: int = 0
    reserved_cents: int = 0
    pending_cents: int = 0
    cashback_cents: int = 0
    credit_cents: int = 0
    gift_card_cents: int = 0
    store_credit_cents: int = 0
    source: str = "financial_platform"

    def to_dict(self) -> dict[str, Any]:
        return {
            "owner_type": self.owner_type.value,
            "owner_id": self.owner_id,
            "available_cents": self.available_cents,
            "reserved_cents": self.reserved_cents,
            "pending_cents": self.pending_cents,
            "cashback_cents": self.cashback_cents,
            "credit_cents": self.credit_cents,
            "gift_card_cents": self.gift_card_cents,
            "store_credit_cents": self.store_credit_cents,
            "source": self.source,
            "checkout_wired": False,
        }


__all__ = [
    "JournalLine",
    "PostedJournal",
    "WalletBuckets",
    "OwnerType",
    "AccountType",
    "TxnType",
    "EscrowStatus",
    "PayoutStatus",
]
