"""Validação de variáveis de ambiente em produção."""

from __future__ import annotations

import os

from app.core.config import Settings, get_settings

PRODUCTION_REQUIRED = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "REDIS_URL",
    "DATABASE_URL",
    "CPF_SALT",
    "SUPABASE_JWT_SECRET",
    "RUNTIME_AUTH_SECRET",
    "CORS_ALLOWED_ORIGINS",
]

PRODUCTION_RECOMMENDED = [
    "VAPID_PRIVATE_KEY",
    "SENDGRID_API_KEY",
    "PIX_WEBHOOK_INTERNAL_SECRET",
    "OPENPIX_WEBHOOK_SECRET",
]


def _setting_value(settings: Settings, key: str) -> str | None:
    if key == "DATABASE_URL":
        return settings.database_url or None
    if key == "REDIS_URL":
        return settings.redis_url or None
    if key == "STRIPE_SECRET_KEY":
        return settings.stripe_secret_key or None
    if key == "STRIPE_WEBHOOK_SECRET":
        return settings.stripe_webhook_secret or None
    if key == "CPF_SALT":
        return settings.cpf_salt or None
    if key == "SUPABASE_JWT_SECRET":
        return settings.supabase_jwt_secret or None
    if key == "RUNTIME_AUTH_SECRET":
        return settings.runtime_auth_secret or None
    if key == "CORS_ALLOWED_ORIGINS":
        raw = (settings.cors_allowed_origins or "").strip()
        if not raw or raw == "*":
            return None
        return raw
    return os.getenv(key)


def validate_production_config(settings: Settings | None = None) -> list[str]:
    """Retorna lista de variáveis ausentes (vazia = OK)."""
    settings = settings or get_settings()
    if settings.environment != "production":
        return []

    missing: list[str] = []
    for key in PRODUCTION_REQUIRED:
        if not _setting_value(settings, key):
            missing.append(key)

    for key in PRODUCTION_RECOMMENDED:
        if key == "PIX_WEBHOOK_INTERNAL_SECRET":
            if not (settings.pix_webhook_internal_secret or "").strip() and not (
                settings.openpix_webhook_secret or ""
            ).strip():
                missing.append(key)
        elif key == "OPENPIX_WEBHOOK_SECRET":
            if settings.openpix_api_key and not (settings.openpix_webhook_secret or "").strip():
                missing.append(key)
        elif not os.getenv(key):
            missing.append(key)

    return missing


def require_production_config(settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    missing_required = [
        k for k in validate_production_config(settings) if k in PRODUCTION_REQUIRED
    ]
    if missing_required:
        raise RuntimeError(f"Missing production env vars: {missing_required}")
