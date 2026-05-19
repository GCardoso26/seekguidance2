import time
from collections import defaultdict
from collections.abc import Callable

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.runtime_minimal import router as runtime_minimal_router
from app.api.v1.runtime_deployments import router as runtime_deployments_router
from app.api.v1.runtime_operational import router as runtime_operational_router
from app.core.config import get_settings
from app.core.logging import configure_logging

configure_logging()
logger = structlog.get_logger(__name__)

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0-mvp")

# Rate limit in-memory (MVP; produção: Redis + token bucket)
_rate: dict[str, list[float]] = defaultdict(list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next: Callable[[Request], Response]) -> Response:
    if request.url.path.startswith("/v1/chat"):
        client = request.client.host if request.client else "unknown"
        now = time.monotonic()
        window = float(settings.api_rate_limit_window_seconds)
        limit = int(settings.api_rate_limit_requests_per_minute)
        window_start = now - window
        hits = _rate[client]
        while hits and hits[0] < window_start:
            hits.pop(0)
        if len(hits) >= limit:
            return Response(status_code=429, content="Rate limit exceeded")
        hits.append(now)
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


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": settings.app_name, "docs": "/docs"}
