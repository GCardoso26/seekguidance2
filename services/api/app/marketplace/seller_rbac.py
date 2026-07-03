"""RBAC granular do painel lojista (equipe da loja)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

# Módulos × ações
PermissionMatrix = dict[str, dict[str, bool]]

_ACTIONS = ("view", "create", "edit", "delete", "export", "approve")
_DENY = dict.fromkeys(_ACTIONS, False)

ROLE_DEFAULTS: dict[str, PermissionMatrix] = {
    "store_owner": {
        m: {a: True for a in ("view", "create", "edit", "delete", "export", "approve")}
        for m in ("orders", "customers", "inventory", "catalog", "tickets", "finance", "settings", "team", "marketing")
    },
    "manager": {
        "orders": {"view": True, "create": True, "edit": True, "delete": False, "export": True, "approve": True},
        "customers": {"view": True, "create": True, "edit": True, "delete": False, "export": True, "approve": False},
        "inventory": {"view": True, "create": True, "edit": True, "delete": False, "export": False, "approve": False},
        "catalog": {"view": True, "create": True, "edit": True, "delete": False, "export": False, "approve": False},
        "tickets": {"view": True, "create": True, "edit": True, "delete": False, "export": False, "approve": False},
        "finance": {"view": True, "create": False, "edit": False, "delete": False, "export": True, "approve": False},
        "settings": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "team": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "marketing": {"view": True, "create": True, "edit": True, "delete": False, "export": True, "approve": False},
    },
    "operator": {
        "orders": {"view": True, "create": False, "edit": True, "delete": False, "export": False, "approve": False},
        "customers": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "inventory": {"view": True, "create": False, "edit": True, "delete": False, "export": False, "approve": False},
        "catalog": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "tickets": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "finance": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "settings": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "team": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "marketing": _DENY,
    },
    "stock_keeper": {
        "orders": _DENY,
        "customers": _DENY,
        "inventory": {"view": True, "create": True, "edit": True, "delete": False, "export": False, "approve": False},
        "catalog": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "tickets": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "finance": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "settings": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "team": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "marketing": _DENY,
    },
    "support": {
        "orders": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "customers": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "inventory": _DENY,
        "catalog": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "tickets": {"view": True, "create": True, "edit": True, "delete": False, "export": False, "approve": False},
        "finance": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "settings": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "team": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "marketing": _DENY,
    },
    "finance": {
        "orders": {"view": True, "create": False, "edit": False, "delete": False, "export": True, "approve": False},
        "customers": _DENY,
        "inventory": _DENY,
        "catalog": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "tickets": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "finance": {"view": True, "create": False, "edit": False, "delete": False, "export": True, "approve": False},
        "settings": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "team": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "marketing": _DENY,
    },
    "marketing": {
        "orders": _DENY,
        "customers": {"view": True, "create": False, "edit": False, "delete": False, "export": True, "approve": False},
        "inventory": _DENY,
        "catalog": {"view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "tickets": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "finance": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "settings": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "team": {"view": False, "create": False, "edit": False, "delete": False, "export": False, "approve": False},
        "marketing": {"view": True, "create": True, "edit": True, "delete": False, "export": True, "approve": False},
    },
}

VALID_ROLES = frozenset(ROLE_DEFAULTS.keys())


def merge_permissions(role: str, override: dict[str, Any] | None) -> PermissionMatrix:
    base = deepcopy(ROLE_DEFAULTS.get(role, ROLE_DEFAULTS["operator"]))
    if not override:
        return base
    for module, actions in override.items():
        if module not in base:
            base[module] = {}
        if isinstance(actions, dict):
            for action, allowed in actions.items():
                base[module][action] = bool(allowed)
    return base


def has_store_permission(
    role: str,
    permissions: dict[str, Any] | None,
    module: str,
    action: str,
) -> bool:
    if role == "store_owner":
        return True
    matrix = merge_permissions(role, permissions)
    return bool(matrix.get(module, {}).get(action))


def effective_role_for_owner() -> str:
    return "store_owner"
