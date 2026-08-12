"""Trust tiers de vitrine — ADR-018 §6."""

from __future__ import annotations

from typing import Any

TIER_VERIFIED = "verified"
TIER_ESTABLISHED = "established"
TIER_RECOMMENDED = "recommended"

TIER_LABELS_PT = {
    TIER_VERIFIED: "Loja verificada",
    TIER_ESTABLISHED: "Loja estabelecida",
    TIER_RECOMMENDED: "Loja recomendada",
}

TIER_EMOJI = {
    TIER_VERIFIED: "🟢",
    TIER_ESTABLISHED: "🔵",
    TIER_RECOMMENDED: "⭐",
}


def resolve_trust_tier(
    store: dict[str, Any],
    *,
    orders_completed: int = 0,
    active_listings: int = 0,
    review_avg: float = 0.0,
    review_count: int = 0,
    cancel_rate: float | None = None,
    ship_on_time_rate: float | None = None,
    trust_score: float | None = None,
) -> str | None:
    """Calcula tier de produto. None = sem selo ADR-018."""
    status = str(store.get("accreditation_status") or "")
    cnpj = str(store.get("cnpj") or "").strip()
    verification = str(store.get("verification_status") or "")

    accredited = status == "approved" or (
        status == "grandfathered" and bool(cnpj)
    ) or verification == "verified"

    if not accredited or not cnpj:
        # Legacy verified without CNPJ still shows Verificada if verification_status set
        if verification == "verified":
            return TIER_VERIFIED
        return None

    tier = TIER_VERIFIED

    established = (
        orders_completed >= 20
        and active_listings >= 50
        and review_count >= 5
        and review_avg >= 4.0
    )
    if established:
        tier = TIER_ESTABLISHED

    recommended = (
        tier == TIER_ESTABLISHED
        and orders_completed >= 100
        and (cancel_rate is None or cancel_rate <= 0.02)
        and (ship_on_time_rate is None or ship_on_time_rate >= 0.95)
        and (trust_score is None or trust_score >= 85)
        and review_avg >= 4.5
    )
    if recommended:
        tier = TIER_RECOMMENDED

    return tier


def trust_tier_payload(tier: str | None) -> dict[str, Any] | None:
    if not tier or tier not in TIER_LABELS_PT:
        return None
    return {
        "id": tier,
        "label": TIER_LABELS_PT[tier],
        "emoji": TIER_EMOJI[tier],
    }
