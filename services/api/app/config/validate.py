"""Validação de variáveis de ambiente em produção."""

from __future__ import annotations

import os

from app.core.config import Settings, get_settings

PRODUCTION_REQUIRED = [
    "STRIPE_SECRET_KEY",
    "REDIS_URL",
    "DATABASE_URL",
    "CPF_SALT",
    "SUPABASE_JWT_SECRET",
]

PRODUCTION_RECOMMENDED = [
    "VAPID_PRIVATE_KEY",
    "SENDGRID_API_KEY",
    "RUNTIME_AUTH_SECRET",
]


def validate_production_config(settings: Settings | None = None) -> list[str]:
    """Retorna lista de variáveis ausentes (vazia = OK)."""
    settings = settings or get_settings()
    if settings.environment != "production":
        return []

    missing: list[str] = []
    for key in PRODUCTION_REQUIRED:
        val = os.getenv(key) or getattr(settings, key.lower(), None)
        if key == "DATABASE_URL":
            val = settings.database_url
        elif key == "REDIS_URL":
            val = settings.redis_url
        elif key == "STRIPE_SECRET_KEY":
            val = settings.stripe_secret_key
        elif key == "CPF_SALT":
            val = settings.cpf_salt
        elif key == "SUPABASE_JWT_SECRET":
            val = settings.supabase_jwt_secret
        if not val:
            missing.append(key)

    for key in PRODUCTION_RECOMMENDED:
        if key == "VAPID_PRIVATE_KEY" and not os.getenv("VAPID_PRIVATE_KEY"):
            missing.append(key)
        elif key == "SENDGRID_API_KEY" and not os.getenv("SENDGRID_API_KEY"):
            missing.append(key)
        elif key == "RUNTIME_AUTH_SECRET" and not settings.runtime_auth_secret:
            missing.append(key)

    return missing


def require_production_config(settings: Settings | None = None) -> None:
    missing = [k for k in PRODUCTION_REQUIRED if k in validate_production_config(settings)]
    if missing:
        raise RuntimeError(f"Missing production env vars: {missing}")
