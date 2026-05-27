"""RBAC e isolamento por tenant."""

from __future__ import annotations

from typing import Any

ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "admin": frozenset({"read", "write", "replay", "tenant_admin", "backup", "metrics"}),
    "operator": frozenset({"read", "write", "replay", "metrics"}),
    "viewer": frozenset({"read", "metrics"}),
}


def permissions_for_role(role: str) -> frozenset[str]:
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["viewer"])


def has_permission(role: str, permission: str) -> bool:
    return permission in permissions_for_role(role)


def assert_tenant_access(
    auth_tenant: str,
    resource_tenant: str,
    *,
    role: str,
) -> bool:
    if has_permission(role, "tenant_admin"):
        return True
    return auth_tenant == resource_tenant


def auth_context_from_payload(payload: dict[str, Any] | None) -> dict[str, Any] | None:
    if not payload:
        return None
    return {
        "user_id": payload.get("sub"),
        "username": payload.get("username"),
        "role": payload.get("role", "viewer"),
        "tenant_id": payload.get("tenant_id", "default"),
    }
