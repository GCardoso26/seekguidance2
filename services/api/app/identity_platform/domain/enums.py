"""Domain enums and value objects — Identity Platform."""

from __future__ import annotations

from enum import StrEnum


class PlatformRole(StrEnum):
    BUYER = "BUYER"
    SELLER_OWNER = "SELLER_OWNER"
    SELLER_MANAGER = "SELLER_MANAGER"
    SELLER_STAFF = "SELLER_STAFF"
    SELLER_STOCK = "SELLER_STOCK"
    SELLER_FINANCE = "SELLER_FINANCE"
    SELLER_SUPPORT = "SELLER_SUPPORT"
    SELLER_JUDGE = "SELLER_JUDGE"
    SELLER_EVENT_MANAGER = "SELLER_EVENT_MANAGER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class MembershipStatus(StrEnum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class CompanyStatus(StrEnum):
    PENDING_CNPJ = "pending_cnpj"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"


class CompanyKycStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    RESTRICTED = "restricted"


class InvitationStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REVOKED = "revoked"
    EXPIRED = "expired"


class SubscriptionPlan(StrEnum):
    FREE = "FREE"
    PRO = "PRO"
    SELLER_STARTER = "SELLER_STARTER"
    SELLER_PRO = "SELLER_PRO"
    ENTERPRISE = "ENTERPRISE"


class SubscriptionSubjectType(StrEnum):
    USER = "user"
    COMPANY = "company"
    STORE = "store"


class SubscriptionStatus(StrEnum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    TRIALING = "trialing"


class InventoryType(StrEnum):
    PRODUCT = "PRODUCT"
    EVENT = "EVENT"
    SERVICE = "SERVICE"
    DIGITAL = "DIGITAL"
    GIFT_CARD = "GIFT_CARD"


class PaymentMethod(StrEnum):
    PIX = "pix"
    STRIPE = "stripe"
    COUNTER = "counter"
    WALLET = "wallet"
    CASHBACK = "cashback"


class WalletBalanceType(StrEnum):
    CASHBACK = "cashback"
    CREDIT = "credit"
    GIFT_CARD = "gift_card"
    REFUND = "refund"
    BALANCE = "balance"
    STORE_CREDIT = "store_credit"


class ConsentPurpose(StrEnum):
    ANALYTICS = "analytics"
    MARKETING = "marketing"
    MARKETPLACE = "marketplace"
    EVENTS = "events"
    COOKIES = "cookies"


class MfaStatus(StrEnum):
    DISABLED = "disabled"
    PENDING = "pending"
    READY = "ready"


class PasskeyStatus(StrEnum):
    DISABLED = "disabled"
    PENDING = "pending"
    READY = "ready"


# Legacy seller_rbac roles → PlatformRole
LEGACY_ROLE_TO_PLATFORM: dict[str, PlatformRole] = {
    "store_owner": PlatformRole.SELLER_OWNER,
    "manager": PlatformRole.SELLER_MANAGER,
    "operator": PlatformRole.SELLER_STAFF,
    "stock_keeper": PlatformRole.SELLER_STOCK,
    "finance": PlatformRole.SELLER_FINANCE,
    "support": PlatformRole.SELLER_SUPPORT,
    "marketing": PlatformRole.SELLER_STAFF,
}

PLATFORM_ROLE_TO_LEGACY: dict[PlatformRole, str] = {
    PlatformRole.SELLER_OWNER: "store_owner",
    PlatformRole.SELLER_MANAGER: "manager",
    PlatformRole.SELLER_STAFF: "operator",
    PlatformRole.SELLER_STOCK: "stock_keeper",
    PlatformRole.SELLER_FINANCE: "finance",
    PlatformRole.SELLER_SUPPORT: "support",
    PlatformRole.SELLER_JUDGE: "operator",
    PlatformRole.SELLER_EVENT_MANAGER: "manager",
}


def map_legacy_role(legacy: str) -> PlatformRole:
    return LEGACY_ROLE_TO_PLATFORM.get(legacy, PlatformRole.SELLER_STAFF)


def map_platform_role_to_legacy(role: PlatformRole) -> str | None:
    return PLATFORM_ROLE_TO_LEGACY.get(role)
