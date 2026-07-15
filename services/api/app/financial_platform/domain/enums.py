"""Financial Platform domain enums."""

from __future__ import annotations

from enum import StrEnum


class OwnerType(StrEnum):
    BUYER = "buyer"
    SELLER = "seller"
    COMPANY = "company"
    STORE = "store"
    PLATFORM = "platform"
    JUDGE = "judge"


class AccountType(StrEnum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class TxnType(StrEnum):
    PURCHASE = "purchase"
    REFUND = "refund"
    CASHBACK = "cashback"
    WITHDRAWAL = "withdrawal"
    DEPOSIT = "deposit"
    ADJUSTMENT = "adjustment"
    PRIZE = "prize"
    GIFT_CARD = "gift_card"
    STORE_CREDIT = "store_credit"
    FEE = "fee"
    COMMISSION = "commission"
    SETTLEMENT = "settlement"
    TRANSFER = "transfer"


class EscrowStatus(StrEnum):
    HELD = "held"
    RELEASED = "released"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"
    MANUAL_HOLD = "manual_hold"


class PayoutStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RefundStatus(StrEnum):
    REQUESTED = "requested"
    REVIEW = "review"
    APPROVED = "approved"
    EXECUTED = "executed"
    REJECTED = "rejected"


class ChargebackStatus(StrEnum):
    RECEIVED = "received"
    ANALYSIS = "analysis"
    WON = "won"
    LOST = "lost"
    REVERSED = "reversed"


class SplitBeneficiary(StrEnum):
    MARKETPLACE = "marketplace"
    STORE = "store"
    JUDGE = "judge"
    ORGANIZER = "organizer"
    AFFILIATE = "affiliate"
    CAMPAIGN = "campaign"


class GiftCardType(StrEnum):
    MARKETPLACE = "marketplace"
    STORE = "store"
    EVENT = "event"
    PROMO = "promo"
    RELOAD = "reload"


REFUND_TRANSITIONS: dict[RefundStatus, frozenset[RefundStatus]] = {
    RefundStatus.REQUESTED: frozenset({RefundStatus.REVIEW, RefundStatus.REJECTED}),
    RefundStatus.REVIEW: frozenset({RefundStatus.APPROVED, RefundStatus.REJECTED}),
    RefundStatus.APPROVED: frozenset({RefundStatus.EXECUTED, RefundStatus.REJECTED}),
    RefundStatus.EXECUTED: frozenset(),
    RefundStatus.REJECTED: frozenset(),
}

CHARGEBACK_TRANSITIONS: dict[ChargebackStatus, frozenset[ChargebackStatus]] = {
    ChargebackStatus.RECEIVED: frozenset({ChargebackStatus.ANALYSIS}),
    ChargebackStatus.ANALYSIS: frozenset(
        {ChargebackStatus.WON, ChargebackStatus.LOST, ChargebackStatus.REVERSED}
    ),
    ChargebackStatus.WON: frozenset(),
    ChargebackStatus.LOST: frozenset({ChargebackStatus.REVERSED}),
    ChargebackStatus.REVERSED: frozenset(),
}

PAYOUT_TRANSITIONS: dict[PayoutStatus, frozenset[PayoutStatus]] = {
    PayoutStatus.PENDING: frozenset({PayoutStatus.PROCESSING, PayoutStatus.CANCELLED}),
    PayoutStatus.PROCESSING: frozenset(
        {PayoutStatus.COMPLETED, PayoutStatus.FAILED, PayoutStatus.CANCELLED}
    ),
    PayoutStatus.COMPLETED: frozenset(),
    PayoutStatus.FAILED: frozenset({PayoutStatus.PENDING}),
    PayoutStatus.CANCELLED: frozenset(),
}

ESCROW_TRANSITIONS: dict[EscrowStatus, frozenset[EscrowStatus]] = {
    EscrowStatus.HELD: frozenset(
        {EscrowStatus.RELEASED, EscrowStatus.DISPUTED, EscrowStatus.CANCELLED, EscrowStatus.MANUAL_HOLD}
    ),
    EscrowStatus.MANUAL_HOLD: frozenset(
        {EscrowStatus.HELD, EscrowStatus.RELEASED, EscrowStatus.CANCELLED}
    ),
    EscrowStatus.DISPUTED: frozenset(
        {EscrowStatus.RELEASED, EscrowStatus.CANCELLED, EscrowStatus.HELD}
    ),
    EscrowStatus.RELEASED: frozenset(),
    EscrowStatus.CANCELLED: frozenset(),
}
