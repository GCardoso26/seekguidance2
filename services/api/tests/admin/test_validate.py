"""Testes de validação de config produção."""

from __future__ import annotations

from app.config.validate import validate_production_config
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
        cpf_salt="x" * 32,
        supabase_jwt_secret="y" * 16,
    )
    missing = validate_production_config(settings)
    assert "STRIPE_SECRET_KEY" in missing
