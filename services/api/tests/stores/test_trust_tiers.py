"""Unit tests for ADR-018 trust tiers."""

from app.stores.trust_tiers import resolve_trust_tier, trust_tier_payload


def test_verified_requires_accreditation_and_cnpj():
    assert (
        resolve_trust_tier(
            {"accreditation_status": "approved", "cnpj": "04.252.011/0001-10"},
        )
        == "verified"
    )
    assert resolve_trust_tier({"accreditation_status": "pending", "cnpj": ""}) is None


def test_established_and_recommended():
    store = {"accreditation_status": "approved", "cnpj": "04.252.011/0001-10"}
    assert (
        resolve_trust_tier(
            store,
            orders_completed=25,
            active_listings=60,
            review_avg=4.2,
            review_count=10,
        )
        == "established"
    )
    assert (
        resolve_trust_tier(
            store,
            orders_completed=120,
            active_listings=80,
            review_avg=4.7,
            review_count=40,
            cancel_rate=0.01,
            ship_on_time_rate=0.98,
            trust_score=90,
        )
        == "recommended"
    )


def test_payload():
    p = trust_tier_payload("verified")
    assert p and p["label"] == "Loja verificada"
