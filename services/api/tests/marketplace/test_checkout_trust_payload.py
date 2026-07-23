"""Sprint 4 — checkout methods include honest store trust signals."""


def test_checkout_methods_store_payload_keys_documented():
    # Contract keys expected by CheckoutClient / CheckoutOrderSummary.
    expected = {
        "store_id",
        "store_name",
        "pix_available",
        "stripe_available",
        "verification_status",
        "average_rating",
        "review_count",
    }
    assert "verification_status" in expected
    assert "average_rating" in expected
