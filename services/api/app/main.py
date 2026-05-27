from collections.abc import Callable



import structlog

from app.api.v1.router import api_router

from app.api.v1.runtime_deployments import router as runtime_deployments_router

from app.api.v1.runtime_judge import router as runtime_judge_router

from app.api.v1.runtime_minimal import router as runtime_minimal_router

from app.api.v1.runtime_operational import router as runtime_operational_router

from app.core.config import get_settings

from app.core.logging import configure_logging

from app.core.rate_limit import allow_request, build_rate_limit_response, client_key

from app.core.security.middleware import (

    https_redirect_middleware,

    operational_guard_middleware,

    redacted_logging_middleware,

    safe_exception_middleware,

    security_headers_middleware,

)

from fastapi import FastAPI, Request, Response

from fastapi.middleware.cors import CORSMiddleware



configure_logging()

logger = structlog.get_logger(__name__)



_cfg = get_settings()

_docs = "/docs" if _cfg.api_docs_enabled and _cfg.environment != "production" else None

_openapi = "/openapi.json" if _docs else None



app = FastAPI(

    title=_cfg.app_name,

    version="0.1.0-mvp",

    docs_url=_docs,

    redoc_url=None,

    openapi_url=_openapi,

)



_cors_origins = [o.strip() for o in _cfg.cors_allowed_origins.split(",") if o.strip()] or ["*"]

app.add_middleware(

    CORSMiddleware,

    allow_origins=_cors_origins,

    allow_credentials="*" not in _cors_origins,

    allow_methods=["GET", "POST", "OPTIONS"],

    allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Forwarded-For"],

)



app.middleware("http")(https_redirect_middleware)

app.middleware("http")(safe_exception_middleware)

app.middleware("http")(operational_guard_middleware)

app.middleware("http")(security_headers_middleware)

app.middleware("http")(redacted_logging_middleware)





def _rate_limit_bucket(path: str, cfg) -> str | None:

    if path.startswith("/v1/chat"):

        return "chat"

    if not cfg.judge_rate_limit_enabled:

        return None

    if path.startswith("/runtime/judge/query"):

        return "judge"

    if path.startswith("/runtime/judge/"):

        return "judge_read"

    if path.startswith("/runtime/replay") or path.startswith("/v1/replay"):

        return "replay"

    if path.startswith("/auth/login"):

        return "auth_login"

    return None





@app.middleware("http")

async def rate_limit_middleware(request: Request, call_next: Callable[[Request], Response]) -> Response:

    cfg = get_settings()

    bucket = _rate_limit_bucket(request.url.path, cfg)

    if bucket:

        if bucket == "judge":

            limit = int(cfg.judge_rate_limit_requests_per_minute)

            window = float(cfg.judge_rate_limit_window_seconds)

        elif bucket == "judge_read":

            limit = max(60, int(cfg.judge_rate_limit_requests_per_minute) * 4)

            window = float(cfg.judge_rate_limit_window_seconds)

        elif bucket == "replay":

            limit = max(30, int(cfg.judge_rate_limit_requests_per_minute) // 2)

            window = float(cfg.judge_rate_limit_window_seconds)

        elif bucket == "auth_login":

            limit = 20

            window = 60.0

        else:

            limit = int(cfg.api_rate_limit_requests_per_minute)

            window = float(cfg.api_rate_limit_window_seconds)

        if not allow_request(

            bucket,

            client_key(request, trust_proxy=cfg.judge_trust_proxy_headers),

            limit=limit,

            window_seconds=window,

            redis_url=cfg.redis_url,

        ):

            return build_rate_limit_response()

    return await call_next(request)





app.include_router(api_router)

app.include_router(runtime_minimal_router)

app.include_router(runtime_operational_router)

app.include_router(runtime_deployments_router)

app.include_router(runtime_judge_router)





@app.get("/")

async def root() -> dict[str, str]:

    return {"service": get_settings().app_name, "docs": "/docs"}


