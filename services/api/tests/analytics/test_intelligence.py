"""Testes Marketplace Intelligence Sprint 8."""

from app.analytics.churn_scoring import _INACTIVE_DAYS_HIGH, _INACTIVE_DAYS_MEDIUM
from app.analytics.pricing_intelligence import _SUGGEST_THRESHOLD_PCT


def test_pricing_threshold_defined() -> None:
    assert _SUGGEST_THRESHOLD_PCT > 0


def test_churn_thresholds_ordered() -> None:
    assert _INACTIVE_DAYS_HIGH > _INACTIVE_DAYS_MEDIUM
