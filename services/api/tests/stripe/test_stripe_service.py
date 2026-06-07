"""Testes unitários — stripe_service (funções puras)."""

from __future__ import annotations

from app.core.config import Settings
from app.judge.stripe_service import (
    features_for_tier,
    free_features,
    resolve_price_id,
    stripe_enabled,
    tier_from_price_id,
)


def _settings() -> Settings:
    return Settings(
        database_url="postgresql+asyncpg://u:p@localhost/db",
        redis_url="redis://localhost:6379/0",
        stripe_secret_key="sk_test_abc",
        stripe_webhook_secret="whsec_test",
        stripe_price_monthly_spike="price_spike_m",
        stripe_price_annual_spike="price_spike_a",
        stripe_price_monthly_team="price_team_m",
        stripe_price_annual_team="price_team_a",
    )


def test_stripe_enabled_requires_both_keys() -> None:
    cfg = _settings()
    assert stripe_enabled(cfg) is True
    assert stripe_enabled(Settings(database_url="x", redis_url="r")) is False


def test_resolve_price_id_aliases() -> None:
    cfg = _settings()
    assert resolve_price_id(cfg, "monthly_spike") == "price_spike_m"
    assert resolve_price_id(cfg, "monthly_pro") == "price_spike_m"
    assert resolve_price_id(cfg, "annual_team") == "price_team_a"
    assert resolve_price_id(cfg, "price_custom_123") == "price_custom_123"


def test_tier_from_price_id() -> None:
    cfg = _settings()
    assert tier_from_price_id(cfg, "price_team_m") == "team"
    assert tier_from_price_id(cfg, "price_spike_m") == "spike"


def test_free_features() -> None:
    f = free_features()
    assert f["deck_builder"] is True
    assert f["advanced_analytics"] is False
    assert f["api_access"] is False


def test_features_for_tier_spike() -> None:
    f = features_for_tier("spike")
    assert f["advanced_analytics"] is True
    assert f["tournament_creation"] is True
    assert f["team_management"] is False
    assert f["api_access"] is False


def test_features_for_tier_team() -> None:
    f = features_for_tier("team")
    assert f["team_management"] is True
    assert f["api_access"] is True


def test_features_for_tier_pro_alias() -> None:
    f = features_for_tier("pro")
    assert f["advanced_analytics"] is True
