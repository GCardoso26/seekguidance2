"""Sprint 3 — sinais de confiança honestos na vitrine."""

from app.marketplace.marketplace_hygiene import PUBLIC_LISTING_SQL


def test_public_listing_sql_excludes_test_stores():
    assert "is_test" in PUBLIC_LISTING_SQL


def test_buyer_ai_trusted_deal_copy_uses_verified_not_fake_score():
    # Contract: insights describe verification / real reviews, not invented trust 75/80.
    from app.marketplace import buyer_ai
    import inspect

    src = inspect.getsource(buyer_ai._trusted_listings)
    assert "verification_status" in src
    assert "seller_scores" not in src
    assert "trust_score >= 80" not in src
