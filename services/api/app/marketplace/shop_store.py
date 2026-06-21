"""Helpers de loja — elegibilidade de venda e limites de plano."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

FREE_PRODUCT_LIMIT = 20
PRO_PRICE_CENTS = 4900
ENTERPRISE_PRICE_CENTS = 19900

STORE_SELLABLE_SQL = """
(
  COALESCE(s.pix_key, '') <> ''
  OR (s.stripe_account_id IS NOT NULL AND s.stripe_onboarding_complete = true)
  OR s.shop_enabled = true
)
"""


def store_is_sellable(store: dict[str, Any]) -> bool:
    if store.get("pix_key"):
        return True
    if store.get("stripe_account_id") and store.get("stripe_onboarding_complete"):
        return True
    return bool(store.get("shop_enabled"))


def store_has_stripe(store: dict[str, Any]) -> bool:
    return bool(store.get("stripe_account_id") and store.get("stripe_onboarding_complete"))


def store_has_pix(store: dict[str, Any]) -> bool:
    return bool(store.get("pix_key"))


def plan_is_active(store: dict[str, Any]) -> bool:
    plan = store.get("subscription_plan") or "free"
    if plan == "free":
        return False
    expires = store.get("subscription_expires_at")
    if expires is None:
        return plan in {"pro", "enterprise"}
    if isinstance(expires, datetime):
        exp_dt = expires if expires.tzinfo else expires.replace(tzinfo=UTC)
        return exp_dt > datetime.now(UTC)
    return True


def effective_plan(store: dict[str, Any]) -> str:
    plan = store.get("subscription_plan") or "free"
    if plan == "free":
        return "free"
    return plan if plan_is_active(store) else "free"


def product_limit_for_plan(plan: str | None) -> int | None:
    if (plan or "free") == "free":
        return FREE_PRODUCT_LIMIT
    return None


def store_is_pro(store: dict[str, Any]) -> bool:
    return effective_plan(store) in {"pro", "enterprise"}
