"""Legacy role adapter mapping."""

from app.identity_platform.domain.enums import (
    PlatformRole,
    map_legacy_role,
    map_platform_role_to_legacy,
)


def test_legacy_to_platform():
    assert map_legacy_role("store_owner") == PlatformRole.SELLER_OWNER
    assert map_legacy_role("manager") == PlatformRole.SELLER_MANAGER
    assert map_legacy_role("stock_keeper") == PlatformRole.SELLER_STOCK
    assert map_legacy_role("finance") == PlatformRole.SELLER_FINANCE
    assert map_legacy_role("unknown_role") == PlatformRole.SELLER_STAFF


def test_platform_to_legacy_roundtrip():
    assert map_platform_role_to_legacy(PlatformRole.SELLER_OWNER) == "store_owner"
    assert map_platform_role_to_legacy(PlatformRole.SELLER_JUDGE) == "operator"
    assert map_platform_role_to_legacy(PlatformRole.SELLER_EVENT_MANAGER) == "manager"
