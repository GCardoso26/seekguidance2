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
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

configure_logging()
logger = structlog.get_logger(__name__)

app = FastAPI(title=get_settings().app_name, version="0.1.0-mvp")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _rate_limit_bucket(path: str, cfg) -> str | None:
    if path.startswith("/v1/chat"):
        return "chat"
    if cfg.judge_rate_limit_enabled and path.startswith("/runtime/judge/query"):
        return "judge"
    return None


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next: Callable[[Request], Response]) -> Response:
    cfg = get_settings()
    bucket = _rate_limit_bucket(request.url.path, cfg)
    if bucket:
        limit = (
            int(cfg.judge_rate_limit_requests_per_minute)
            if bucket == "judge"
            else int(cfg.api_rate_limit_requests_per_minute)
        )
        window = (
            float(cfg.judge_rate_limit_window_seconds)
            if bucket == "judge"
            else float(cfg.api_rate_limit_window_seconds)
        )
        if not allow_request(
            bucket,
            client_key(request),
            limit=limit,
            window_seconds=window,
            redis_url=cfg.redis_url,
        ):
            return build_rate_limit_response()
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next: Callable[[Request], Response]) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.middleware("http")
async def logging_middleware(request: Request, call_next: Callable[[Request], Response]) -> Response:
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(path=request.url.path, method=request.method)
    response = await call_next(request)
    logger.info("http_request", status_code=response.status_code)
    return response


app.include_router(api_router)
app.include_router(runtime_minimal_router)
app.include_router(runtime_operational_router)
app.include_router(runtime_deployments_router)
app.include_router(runtime_judge_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": get_settings().app_name, "docs": "/docs"}
