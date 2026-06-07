"""Testes de lojas."""

from __future__ import annotations

from app.stores.store import COMMISSION_BY_PLAN, PLAN_FEATURES, SLUG_RE


class TestStores:
    def test_slug_regex(self):
        assert SLUG_RE.match("tcg-central")
        assert not SLUG_RE.match("ab")

    def test_pro_features(self):
        assert "analytics_advanced" in PLAN_FEATURES["pro"]

    def test_commission_enterprise(self):
        assert COMMISSION_BY_PLAN["enterprise"] == 5
