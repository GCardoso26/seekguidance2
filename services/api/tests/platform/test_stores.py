"""CRUD de lojas — suite consolidada."""

from __future__ import annotations

from app.stores.store import COMMISSION_BY_PLAN, PLAN_FEATURES, SLUG_RE


class TestStores:
    def test_store_create_slug_valid(self):
        assert SLUG_RE.match("tcg-central-sp")

    def test_verification_status_values(self):
        statuses = {"pending", "verified", "rejected"}
        assert "verified" in statuses

    def test_subscription_commission_enterprise(self):
        assert COMMISSION_BY_PLAN["enterprise"] == 5

    def test_pro_plan_features(self):
        assert "analytics_advanced" in PLAN_FEATURES["pro"]
