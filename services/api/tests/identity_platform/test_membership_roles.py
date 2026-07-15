"""Membership / invitation domain contracts (no DB)."""

from app.identity_platform.domain import DEFAULT_PAYMENT_POLICIES
from app.identity_platform.domain.enums import (
    InventoryType,
    MembershipStatus,
    PaymentMethod,
    PlatformRole,
)
from app.identity_platform.permissions.registry import role_has_permission


def test_membership_status_has_no_boolean_role_flags():
    # Roles and statuses are enums — never is_seller / is_owner booleans
    assert MembershipStatus.ACTIVE.value == "active"
    assert PlatformRole.SELLER_OWNER.value == "SELLER_OWNER"
    assert not hasattr(PlatformRole, "is_seller")


def test_invite_roles_staff_allowed_owner_has_invite_perm():
    assert role_has_permission(PlatformRole.SELLER_OWNER, "store.team.invite")
    assert role_has_permission(PlatformRole.SELLER_OWNER, "store.team.manage")
    assert not role_has_permission(PlatformRole.SELLER_STOCK, "store.team.invite")


def test_payment_policy_defaults():
    event = DEFAULT_PAYMENT_POLICIES[InventoryType.EVENT]
    product = DEFAULT_PAYMENT_POLICIES[InventoryType.PRODUCT]
    assert PaymentMethod.WALLET in event
    assert PaymentMethod.COUNTER in product
    assert PaymentMethod.COUNTER not in event
