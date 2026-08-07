"""Testes de validação de config produção."""

from __future__ import annotations

from app.config.validate import PRODUCTION_REQUIRED, validate_production_config
from app.core.config import Settings


def test_dev_skips_validation():
    settings = Settings(database_url="postgresql://x", redis_url="redis://x", environment="development")
    assert validate_production_config(settings) == []


def test_production_missing_stripe():
    settings = Settings(
        database_url="postgresql://x",
        redis_url="redis://x",
        environment="production",
        stripe_secret_key=None,
        stripe_webhook_secret="whsec_x",
        cpf_salt="x" * 32,
        supabase_jwt_secret="y" * 16,
        runtime_auth_secret="z" * 32,
        cors_allowed_origins="https://judgetcg.com.br",
    )
    missing = validate_production_config(settings)
    assert "STRIPE_SECRET_KEY" in missing


def test_production_rejects_wildcard_cors():
    settings = Settings(
        database_url="postgresql://x",
        redis_url="redis://x",
        environment="production",
        stripe_secret_key="sk_test",
        stripe_webhook_secret="whsec_x",
        cpf_salt="x" * 32,
        supabase_jwt_secret="y" * 16,
        runtime_auth_secret="z" * 32,
        cors_allowed_origins="*",
    )
    missing = validate_production_config(settings)
    assert "CORS_ALLOWED_ORIGINS" in missing


def test_production_required_includes_webhook_and_auth_secret():
    assert "STRIPE_WEBHOOK_SECRET" in PRODUCTION_REQUIRED
    assert "RUNTIME_AUTH_SECRET" in PRODUCTION_REQUIRED
    assert "CORS_ALLOWED_ORIGINS" in PRODUCTION_REQUIRED
