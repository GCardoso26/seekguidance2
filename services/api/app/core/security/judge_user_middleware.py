"""Exige JWT Supabase quando X-Judge-User-Id ou rotas sensíveis são usadas."""

from __future__ import annotations

from collections.abc import Callable

import structlog
from app.core.config import get_settings
from app.core.security.judge_user_context import verified_judge_user_id
from app.core.security.supabase_jwt import verify_supabase_access_token
from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = structlog.get_logger(__name__)

_WEBHOOK_PREFIXES = (
    "/runtime/judge/stripe/webhook",
    "/runtime/judge/webhooks/payments",
    "/runtime/judge/marketplace/shop/pix/webhook",
)

_SENSITIVE_MUTATION_PREFIXES = (
    "/runtime/judge/account/",
    "/runtime/judge/merchant/",
    "/runtime/judge/seller/",
    "/runtime/judge/checkout/",
    "/runtime/judge/marketplace/shop/cart",
    "/runtime/judge/marketplace/shop/checkout",
    "/runtime/judge/marketplace/shop/orders",
    "/runtime/judge/marketplace/shop/stores/",
    "/runtime/judge/marketplace/listings",
)


def _is_webhook(path: str) -> bool:
    return any(path.startswith(p) for p in _WEBHOOK_PREFIXES)


def _needs_jwt(path: str, method: str, has_user_header: bool) -> bool:
    if method in ("GET", "HEAD", "OPTIONS"):
        return has_user_header
    return has_user_header or any(path.startswith(p) for p in _SENSITIVE_MUTATION_PREFIXES)


def _extract_bearer(request: Request) -> str | None:
    auth = request.headers.get("authorization") or ""
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        return token or None
    return None


async def judge_user_auth_middleware(request: Request, call_next: Callable) -> Response:
    settings = get_settings()
    token = verified_judge_user_id.set(None)
    try:
        path = request.url.path
        method = request.method.upper()

        if _is_webhook(path) or not settings.should_enforce_supabase_jwt():
            return await call_next(request)

        user_header = (request.headers.get("x-judge-user-id") or "").strip()
        if not _needs_jwt(path, method, bool(user_header)):
            return await call_next(request)

        secret = (settings.supabase_jwt_secret or "").strip()
        supabase_url = settings.resolve_supabase_url()
        if not secret and not supabase_url:
            logger.error("supabase_jwt_config_missing_with_enforcement")
            return JSONResponse(status_code=503, content={"detail": "Autenticação indisponível"})

        bearer = _extract_bearer(request)
        if not bearer:
            return JSONResponse(status_code=401, content={"detail": "Token de autenticação necessário"})

        payload = verify_supabase_access_token(
            bearer,
            secret or None,
            supabase_url=supabase_url,
        )
        if not payload:
            return JSONResponse(status_code=401, content={"detail": "Token inválido ou expirado"})

        sub = str(payload["sub"]).strip()
        if user_header and user_header != sub:
            return JSONResponse(status_code=403, content={"detail": "Identidade do usuário inconsistente"})

        verified_judge_user_id.set(sub)
        request.state.verified_user_id = sub
        return await call_next(request)
    finally:
        verified_judge_user_id.reset(token)
