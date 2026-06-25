"""Testes Sprint 4 — planos e limites de lojista."""

from app.marketplace.shop_store import (
    FREE_PRODUCT_LIMIT,
    LOJISTA_PRODUCT_LIMIT,
    PRO_PRODUCT_LIMIT,
    plan_has_feature,
    product_limit_for_plan,
)


def test_product_limits_by_plan():
    assert product_limit_for_plan("free") == FREE_PRODUCT_LIMIT
    assert product_limit_for_plan("lojista") == LOJISTA_PRODUCT_LIMIT
    assert product_limit_for_plan("pro") == PRO_PRODUCT_LIMIT
    assert product_limit_for_plan("enterprise") is None


def test_plan_features():
    assert plan_has_feature("free", "buylist") is False
    assert plan_has_feature("lojista", "buylist") is True
    assert plan_has_feature("lojista", "pdv") is False
    assert plan_has_feature("pro", "pdv") is True
    assert plan_has_feature("enterprise", "api") is True
