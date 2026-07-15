"""Permission registry unit tests."""

from app.identity_platform.domain.enums import PlatformRole
from app.identity_platform.permissions.registry import (
    PERMISSIONS,
    permissions_for_role,
    role_has_permission,
)
from app.identity_platform.permissions.service import can_sync


def test_owner_has_finance_and_team():
    assert role_has_permission(PlatformRole.SELLER_OWNER, "store.finance.view")
    assert role_has_permission(PlatformRole.SELLER_OWNER, "store.team.manage")


def test_judge_has_events_not_finance():
    assert role_has_permission(PlatformRole.SELLER_JUDGE, "store.events.checkin")
    assert role_has_permission(PlatformRole.SELLER_JUDGE, "store.events.pairings")
    assert not role_has_permission(PlatformRole.SELLER_JUDGE, "store.finance.view")
    assert not role_has_permission(PlatformRole.SELLER_JUDGE, "store.finance.export")


def test_event_manager_has_capacity_and_prizes():
    assert role_has_permission(PlatformRole.SELLER_EVENT_MANAGER, "store.events.capacity")
    assert role_has_permission(PlatformRole.SELLER_EVENT_MANAGER, "store.events.prizes")
    assert not role_has_permission(PlatformRole.SELLER_EVENT_MANAGER, "store.finance.approve")


def test_stock_limited():
    perms = permissions_for_role(PlatformRole.SELLER_STOCK)
    assert "store.inventory.view" in perms
    assert "store.orders.view" not in perms


def test_buyer_has_no_store_perms():
    assert permissions_for_role(PlatformRole.BUYER) == frozenset()


def test_can_sync_rejects_unknown_permission():
    assert not can_sync(PlatformRole.SELLER_OWNER, "store.unknown.hack")


def test_catalog_covers_all_roles():
    assert PlatformRole.SUPER_ADMIN in {r for r in PlatformRole}
    assert "platform.admin" in PERMISSIONS
    assert role_has_permission(PlatformRole.SUPER_ADMIN, "platform.admin")
    assert not role_has_permission(PlatformRole.ADMIN, "platform.admin")
