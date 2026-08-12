"""Helpers de loja — elegibilidade de venda e limites de plano (ADR-018)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

LOJISTA_PRODUCT_LIMIT = 500
PRO_PRODUCT_LIMIT = 5000

LOJISTA_PRICE_CENTS = 4990
PRO_PRICE_CENTS = 14990
ENTERPRISE_PRICE_CENTS = 19900

# Legacy alias — free não é mais seller válido; limite 0.
FREE_PRODUCT_LIMIT = 0

STORE_SELLABLE_SQL = """
(
  COALESCE(s.pix_key, '') <> ''
  OR (s.stripe_account_id IS NOT NULL AND s.stripe_onboarding_complete = true)
  OR s.shop_enabled = true
)
"""


def store_is_sellable(store: dict[str, Any]) -> bool:
    """Meios de pagamento / shop_enabled. Credenciamento é gate separado (ADR-018)."""
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
    plan = store.get("subscription_plan") or "pending_accreditation"
    if plan in {"free", "pending_accreditation"}:
        return False
    expires = store.get("subscription_expires_at")
    if expires is None:
        return plan in {"lojista", "pro", "enterprise"}
    if isinstance(expires, datetime):
        exp_dt = expires if expires.tzinfo else expires.replace(tzinfo=UTC)
        return exp_dt > datetime.now(UTC)
    return True


def effective_plan(store: dict[str, Any]) -> str:
    plan = store.get("subscription_plan") or "pending_accreditation"
    if plan in {"free", "pending_accreditation"}:
        return "pending_accreditation"
    return plan if plan_is_active(store) else "pending_accreditation"


def product_limit_for_plan(plan: str | None) -> int | None:
    p = plan or "pending_accreditation"
    if p in {"free", "pending_accreditation"}:
        return 0
    if p == "lojista":
        return LOJISTA_PRODUCT_LIMIT
    if p == "pro":
        return PRO_PRODUCT_LIMIT
    return None


def plan_has_feature(plan: str | None, feature: str) -> bool:
    """buylist, crm, analytics → lojista+; pdv, api → pro+. free/pending = sem features seller."""
    p = plan or "pending_accreditation"
    lojista_plus = {"lojista", "pro", "enterprise"}
    pro_plus = {"pro", "enterprise"}
    if feature in {"buylist", "crm", "analytics"}:
        return p in lojista_plus
    if feature in {"pdv", "api", "custom_domain"}:
        return p in pro_plus
    if feature == "listings":
        return p in lojista_plus
    return False


def store_plan_has_feature(store: dict[str, Any], feature: str) -> bool:
    return plan_has_feature(effective_plan(store), feature)


def store_is_lojista_plus(store: dict[str, Any]) -> bool:
    return effective_plan(store) in {"lojista", "pro", "enterprise"}


def store_is_pro(store: dict[str, Any]) -> bool:
    return effective_plan(store) in {"pro", "enterprise"}
