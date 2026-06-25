"""Helpers de loja — elegibilidade de venda e limites de plano."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

FREE_PRODUCT_LIMIT = 50
LOJISTA_PRODUCT_LIMIT = 500
PRO_PRODUCT_LIMIT = 5000

LOJISTA_PRICE_CENTS = 4990
PRO_PRICE_CENTS = 14990
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
        return plan in {"lojista", "pro", "enterprise"}
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
    p = plan or "free"
    if p == "free":
        return FREE_PRODUCT_LIMIT
    if p == "lojista":
        return LOJISTA_PRODUCT_LIMIT
    if p == "pro":
        return PRO_PRODUCT_LIMIT
    return None


def plan_has_feature(plan: str | None, feature: str) -> bool:
    """buylist, crm, analytics → lojista+; pdv, api → pro+."""
    p = plan or "free"
    lojista_plus = {"lojista", "pro", "enterprise"}
    pro_plus = {"pro", "enterprise"}
    if feature in {"buylist", "crm", "analytics"}:
        return p in lojista_plus
    if feature in {"pdv", "api", "custom_domain"}:
        return p in pro_plus
    return False


def store_plan_has_feature(store: dict[str, Any], feature: str) -> bool:
    return plan_has_feature(effective_plan(store), feature)


def store_is_lojista_plus(store: dict[str, Any]) -> bool:
    return effective_plan(store) in {"lojista", "pro", "enterprise"}


def store_is_pro(store: dict[str, Any]) -> bool:
    return effective_plan(store) in {"pro", "enterprise"}
