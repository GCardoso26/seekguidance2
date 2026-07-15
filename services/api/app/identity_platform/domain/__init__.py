"""Domain entities (dataclasses) — no persistence coupling."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from app.identity_platform.domain.enums import (
    CompanyKycStatus,
    CompanyStatus,
    ConsentPurpose,
    InventoryType,
    MembershipStatus,
    MfaStatus,
    PasskeyStatus,
    PaymentMethod,
    PlatformRole,
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionSubjectType,
)


@dataclass(frozen=True)
class UserIdentity:
    id: str
    display_name: str | None = None
    email: str | None = None
    phone: str | None = None
    account_status: str | None = None
    cpf_verified: bool = False
    address: dict[str, Any] | None = None
    mfa_status: MfaStatus = MfaStatus.DISABLED
    passkey_status: PasskeyStatus = PasskeyStatus.DISABLED


@dataclass(frozen=True)
class Company:
    id: str
    cnpj: str | None
    legal_name: str
    trade_name: str | None
    state_registration: str | None
    address: dict[str, Any]
    status: CompanyStatus
    kyc_status: CompanyKycStatus
    trust_score: int = 0
    created_by: str | None = None


@dataclass(frozen=True)
class Membership:
    id: str
    user_id: str
    store_id: str
    role: PlatformRole
    status: MembershipStatus
    invited_by: str | None = None
    created_at: datetime | None = None
    accepted_at: datetime | None = None


@dataclass(frozen=True)
class StoreInvitation:
    id: str
    store_id: str
    email: str
    role: PlatformRole
    token: str
    status: str
    invited_by: str
    expires_at: datetime | None = None


@dataclass(frozen=True)
class PlatformSubscription:
    id: str
    subject_type: SubscriptionSubjectType
    subject_id: str
    plan: SubscriptionPlan
    status: SubscriptionStatus
    period_start: datetime | None = None
    period_end: datetime | None = None


@dataclass(frozen=True)
class PaymentPolicyRow:
    store_id: str
    inventory_type: InventoryType
    methods: frozenset[PaymentMethod]


@dataclass
class ConsentRecord:
    user_id: str
    purpose: ConsentPurpose
    granted: bool
    version: str = "1"
    granted_at: datetime | None = None


DEFAULT_PAYMENT_POLICIES: dict[InventoryType, frozenset[PaymentMethod]] = {
    InventoryType.PRODUCT: frozenset(
        {PaymentMethod.PIX, PaymentMethod.STRIPE, PaymentMethod.COUNTER}
    ),
    InventoryType.EVENT: frozenset(
        {PaymentMethod.PIX, PaymentMethod.STRIPE, PaymentMethod.WALLET}
    ),
    InventoryType.SERVICE: frozenset({PaymentMethod.PIX, PaymentMethod.STRIPE}),
    InventoryType.DIGITAL: frozenset(
        {PaymentMethod.PIX, PaymentMethod.STRIPE, PaymentMethod.WALLET}
    ),
    InventoryType.GIFT_CARD: frozenset(
        {PaymentMethod.PIX, PaymentMethod.STRIPE, PaymentMethod.WALLET}
    ),
}
