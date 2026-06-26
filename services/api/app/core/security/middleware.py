"""Middleware de segurança — HTTPS, headers, RBAC global, erros sanitizados."""

from __future__ import annotations

from collections.abc import Callable

import structlog
from app.core.config import get_settings
from app.core.security.headers import apply_security_headers
from app.core.security.rbac import has_permission
from app.core.security.redaction import sanitize_exception_message
from app.core.security.tenant import resolve_auth
from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = structlog.get_logger(__name__)

_PUBLIC_EXACT = frozenset(
    {
        "/",
        "/health",
        "/v1/health",
        "/runtime/judge/health",
        "/runtime/judge/me",
        "/runtime/judge/catalog/games",
        "/runtime/judge/stripe/webhook",
        "/runtime/judge/webhooks/payments",
        "/runtime/warmup",
        "/v1/replay/health",
        "/auth/login",
        "/auth/refresh",
        "/auth/logout",
    }
)

_PUBLIC_PREFIXES = (
    "/runtime/judge/query",
    "/runtime/judge/",
)

_SENSITIVE_WRITE = (
    ("/runtime/backup", "backup"),
    ("/runtime/restore", "backup"),
)

_RUNTIME_GET_PREFIXES = (
    "/runtime/status",
    "/runtime/replay",
    "/runtime/tenants",
    "/runtime/events",
    "/runtime/federation",
    "/runtime/health",
    "/runtime/diagnostics",
    "/runtime/pilot",
    "/runtime/incidents",
    "/runtime/support",
    "/runtime/onboarding",
    "/runtime/deployments",
    "/runtime/metrics",
)


def _is_public(path: str) -> bool:
    if path in _PUBLIC_EXACT:
        return True
    return any(path.startswith(p) for p in _PUBLIC_PREFIXES)


def _permission_for_path(path: str, method: str) -> str | None:
    """Permissão RBAC exigida; None = só autenticação."""
    if path.startswith("/v1/replay") and path != "/v1/replay/health":
        return "replay"
    if path.startswith("/runtime/replay") and method in ("POST", "PUT", "PATCH", "DELETE"):
        return "replay"
    for prefix, perm in _SENSITIVE_WRITE:
        if path.startswith(prefix):
            return perm
    if path.startswith("/runtime/tenants") and method == "POST":
        return "tenant_admin"
    if path.startswith("/metrics") or path.startswith("/runtime/metrics"):
        return "metrics"
    if path.startswith("/runtime/admin/ingestion"):
        return "ingestion_admin"
    if method == "GET" and any(path.startswith(p) for p in _RUNTIME_GET_PREFIXES):
        return "read"
    if path.startswith("/runtime/") and method in ("POST", "PUT", "PATCH", "DELETE"):
        return "write"
    if path.startswith("/v1/replay"):
        return "replay"
    return "read"


async def https_redirect_middleware(request: Request, call_next: Callable) -> Response:
    cfg = get_settings()
    if not cfg.security_force_https:
        return await call_next(request)

    proto = (request.headers.get("x-forwarded-proto") or request.url.scheme or "").lower()
    host = request.url.hostname or ""
    if proto == "https" or host in ("localhost", "127.0.0.1", "testserver"):
        return await call_next(request)

    url = str(request.url).replace("http://", "https://", 1)
    return Response(status_code=308, headers={"Location": url})


async def operational_guard_middleware(request: Request, call_next: Callable) -> Response:
    cfg = get_settings()
    path = request.url.path
    method = request.method.upper()

    if not cfg.security_protect_operational_routes or cfg.environment != "production":
        return await call_next(request)

    if _is_public(path):
        return await call_next(request)

    if path.startswith("/v1/chat"):
        return await call_next(request)

    if path.startswith("/v1/games"):
        return await call_next(request)

    protected_prefixes = (
        "/runtime/",
        "/v1/replay",
        "/metrics",
        "/runtime/metrics",
    )
    if not any(path.startswith(p) for p in protected_prefixes):
        return await call_next(request)

    auth = resolve_auth(
        request.headers.get("authorization"),
        request.headers.get("x-api-key"),
    )
    if not auth:
        return JSONResponse(status_code=401, content={"detail": "Autenticação necessária"})

    perm = _permission_for_path(path, method)
    if perm and not has_permission(str(auth.get("role", "viewer")), perm):
        return JSONResponse(status_code=403, content={"detail": "Permissão insuficiente"})

    request.state.auth = auth
    return await call_next(request)


async def security_headers_middleware(request: Request, call_next: Callable) -> Response:
    response = await call_next(request)
    cfg = get_settings()
    for key, value in _header_dict(request.url.path, cfg).items():
        response.headers[key] = value
    return response


def _header_dict(request_path: str, cfg) -> dict[str, str]:
    h: dict[str, str] = {}
    apply_security_headers(h, request_path, cfg)
    return h


async def safe_exception_middleware(request: Request, call_next: Callable) -> Response:
    try:
        return await call_next(request)
    except Exception as exc:
        cfg = get_settings()
        logger.exception(
            "unhandled_exception",
            error=sanitize_exception_message(exc),
            path=request.url.path,
        )
        detail = sanitize_exception_message(exc) if cfg.environment != "production" else "Erro interno do servidor"
        return JSONResponse(status_code=500, content={"detail": detail})


async def redacted_logging_middleware(request: Request, call_next: Callable) -> Response:
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        path=request.url.path,
        method=request.method,
    )
    response = await call_next(request)
    logger.info("http_request", status_code=response.status_code)
    return response
