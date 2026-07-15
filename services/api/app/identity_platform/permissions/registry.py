"""Permission catalog — stable string permissions (never hardcode role checks in callers)."""

from __future__ import annotations

from app.identity_platform.domain.enums import PlatformRole

# Canonical permission strings
PERMISSIONS: frozenset[str] = frozenset(
    {
        # store core
        "store.orders.view",
        "store.orders.create",
        "store.orders.edit",
        "store.orders.delete",
        "store.orders.export",
        "store.orders.approve",
        "store.customers.view",
        "store.customers.create",
        "store.customers.edit",
        "store.customers.export",
        "store.inventory.view",
        "store.inventory.create",
        "store.inventory.edit",
        "store.inventory.delete",
        "store.catalog.view",
        "store.catalog.create",
        "store.catalog.edit",
        "store.tickets.view",
        "store.tickets.create",
        "store.tickets.edit",
        "store.finance.view",
        "store.finance.export",
        "store.finance.approve",
        "store.settings.view",
        "store.settings.edit",
        "store.team.view",
        "store.team.invite",
        "store.team.manage",
        "store.marketing.view",
        "store.marketing.edit",
        "store.marketing.export",
        # events / judge
        "store.events.view",
        "store.events.create",
        "store.events.edit",
        "store.events.checkin",
        "store.events.pairings",
        "store.events.standings",
        "store.events.tickets",
        "store.events.results",
        "store.events.capacity",
        "store.events.prizes",
        "store.events.staff",
        # company / platform
        "company.view",
        "company.edit",
        "company.kyc.submit",
        "platform.admin",
    }
)

_ALL_STORE = frozenset(p for p in PERMISSIONS if p.startswith("store."))
_NO_FINANCE = frozenset(p for p in _ALL_STORE if not p.startswith("store.finance."))
_EVENTS = frozenset(p for p in PERMISSIONS if p.startswith("store.events."))

ROLE_PERMISSIONS: dict[PlatformRole, frozenset[str]] = {
    PlatformRole.BUYER: frozenset(),
    PlatformRole.SELLER_OWNER: _ALL_STORE | frozenset({"company.view", "company.edit", "company.kyc.submit"}),
    PlatformRole.SELLER_MANAGER: frozenset(
        {
            "store.orders.view",
            "store.orders.create",
            "store.orders.edit",
            "store.orders.export",
            "store.orders.approve",
            "store.customers.view",
            "store.customers.create",
            "store.customers.edit",
            "store.customers.export",
            "store.inventory.view",
            "store.inventory.create",
            "store.inventory.edit",
            "store.catalog.view",
            "store.catalog.create",
            "store.catalog.edit",
            "store.tickets.view",
            "store.tickets.create",
            "store.tickets.edit",
            "store.finance.view",
            "store.finance.export",
            "store.settings.view",
            "store.team.view",
            "store.marketing.view",
            "store.marketing.edit",
            "store.marketing.export",
            "store.events.view",
            "store.events.create",
            "store.events.edit",
            "store.events.staff",
            "company.view",
        }
    ),
    PlatformRole.SELLER_STAFF: frozenset(
        {
            "store.orders.view",
            "store.orders.edit",
            "store.customers.view",
            "store.inventory.view",
            "store.inventory.edit",
            "store.catalog.view",
            "store.tickets.view",
            "store.marketing.view",
            "store.marketing.edit",
            "store.marketing.export",
            "store.events.view",
        }
    ),
    PlatformRole.SELLER_STOCK: frozenset(
        {
            "store.inventory.view",
            "store.inventory.create",
            "store.inventory.edit",
            "store.catalog.view",
        }
    ),
    PlatformRole.SELLER_FINANCE: frozenset(
        {
            "store.orders.view",
            "store.orders.export",
            "store.finance.view",
            "store.finance.export",
        }
    ),
    PlatformRole.SELLER_SUPPORT: frozenset(
        {
            "store.orders.view",
            "store.customers.view",
            "store.tickets.view",
            "store.tickets.create",
            "store.tickets.edit",
        }
    ),
    PlatformRole.SELLER_JUDGE: _EVENTS
    | frozenset(
        {
            "store.events.view",
            "store.events.checkin",
            "store.events.pairings",
            "store.events.standings",
            "store.events.tickets",
            "store.events.results",
        }
    ),
    PlatformRole.SELLER_EVENT_MANAGER: _EVENTS
    | frozenset(
        {
            "store.events.view",
            "store.events.create",
            "store.events.edit",
            "store.events.checkin",
            "store.events.pairings",
            "store.events.standings",
            "store.events.tickets",
            "store.events.results",
            "store.events.capacity",
            "store.events.prizes",
            "store.events.staff",
            "store.team.view",
        }
    ),
    PlatformRole.ADMIN: PERMISSIONS - frozenset({"platform.admin"}),
    PlatformRole.SUPER_ADMIN: PERMISSIONS,
}


def permissions_for_role(role: PlatformRole) -> frozenset[str]:
    return ROLE_PERMISSIONS.get(role, frozenset())


def role_has_permission(role: PlatformRole, permission: str) -> bool:
    if permission not in PERMISSIONS:
        return False
    return permission in permissions_for_role(role)


def list_catalog() -> list[dict[str, object]]:
    return [
        {
            "role": role.value,
            "permissions": sorted(perms),
        }
        for role, perms in ROLE_PERMISSIONS.items()
    ]


# Map legacy module.action → platform permission (for dual-read with seller_rbac)
LEGACY_MODULE_ACTION_TO_PERMISSION: dict[tuple[str, str], str] = {
    ("orders", "view"): "store.orders.view",
    ("orders", "create"): "store.orders.create",
    ("orders", "edit"): "store.orders.edit",
    ("orders", "delete"): "store.orders.delete",
    ("orders", "export"): "store.orders.export",
    ("orders", "approve"): "store.orders.approve",
    ("customers", "view"): "store.customers.view",
    ("customers", "create"): "store.customers.create",
    ("customers", "edit"): "store.customers.edit",
    ("customers", "export"): "store.customers.export",
    ("inventory", "view"): "store.inventory.view",
    ("inventory", "create"): "store.inventory.create",
    ("inventory", "edit"): "store.inventory.edit",
    ("inventory", "delete"): "store.inventory.delete",
    ("catalog", "view"): "store.catalog.view",
    ("catalog", "create"): "store.catalog.create",
    ("catalog", "edit"): "store.catalog.edit",
    ("tickets", "view"): "store.tickets.view",
    ("tickets", "create"): "store.tickets.create",
    ("tickets", "edit"): "store.tickets.edit",
    ("finance", "view"): "store.finance.view",
    ("finance", "export"): "store.finance.export",
    ("finance", "approve"): "store.finance.approve",
    ("settings", "view"): "store.settings.view",
    ("settings", "edit"): "store.settings.edit",
    ("team", "view"): "store.team.view",
    ("team", "create"): "store.team.invite",
    ("team", "edit"): "store.team.manage",
    ("marketing", "view"): "store.marketing.view",
    ("marketing", "edit"): "store.marketing.edit",
    ("marketing", "export"): "store.marketing.export",
}
