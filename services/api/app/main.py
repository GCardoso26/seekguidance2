from collections.abc import Callable
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.analytics_runtime.api.router import router as product_analytics_runtime_router
from app.api.v1.admin_api import router as admin_api_router
from app.api.v1.alerts_api import router as alerts_api_router
from app.api.v1.buyer_api import router as buyer_api_router
from app.api.v1.carrier_api import router as carrier_api_router
from app.api.v1.checkout_seller_api import checkout_router, seller_router
from app.api.v1.decks_api import router as decks_api_router
from app.api.v1.gamification_api import router as gamification_api_router
from app.api.v1.judge_assistant import router as judge_assistant_router
from app.api.v1.judge_calls_api import router as judge_calls_router
from app.api.v1.judge_product import router as judge_product_router
from app.api.v1.kyc_api import router as kyc_api_router
from app.api.v1.leagues_api import router as leagues_api_router
from app.api.v1.marketplace_api import router as marketplace_api_router
from app.api.v1.marketplace_sellers_api import router as marketplace_sellers_api_router
from app.api.v1.overlay_api import router as overlay_api_router
from app.api.v1.platform_api import router as platform_api_router
from app.api.v1.players_ecosystem import router as players_ecosystem_router
from app.api.v1.public_api_v1 import router as public_api_v1_router
from app.api.v1.reviews_api import router as reviews_api_router
from app.api.v1.router import api_router
from app.api.v1.runtime_deployments import router as runtime_deployments_router
from app.api.v1.runtime_ingestion_admin import router as runtime_ingestion_admin_router
from app.api.v1.runtime_judge import router as runtime_judge_router
from app.api.v1.runtime_minimal import router as runtime_minimal_router
from app.api.v1.runtime_operational import router as runtime_operational_router
from app.api.v1.seller_ai_api import router as seller_ai_router
from app.api.v1.seller_dashboard_api import router as seller_dashboard_router
from app.api.v1.shop_api import router as shop_api_router
from app.api.v1.social_api import router as social_api_router
from app.api.v1.sponsorships_api import router as sponsorships_api_router
from app.api.v1.stores_api import router as stores_api_router
from app.api.v1.stripe_billing import router as stripe_billing_router
from app.api.v1.tournament_flow import router as tournament_flow_router
from app.api.v1.tournament_system import router as tournament_system_router
from app.catalog.catalog_api import router as catalog_api_router
from app.catalog.games_api import router as catalog_games_api_router
from app.config.sentry import init_sentry
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.rate_limit import allow_request, build_rate_limit_response, client_key
from app.core.security.judge_user_middleware import judge_user_auth_middleware
from app.core.security.middleware import (
    https_redirect_middleware,
    operational_guard_middleware,
    redacted_logging_middleware,
    safe_exception_middleware,
    security_headers_middleware,
)
from app.financial_platform.api import router as financial_platform_router
from app.identity_platform.api import router as identity_platform_router
from app.tournament_platform.api import router as tournament_platform_router

init_sentry()
configure_logging()

logger = structlog.get_logger(__name__)



_cfg = get_settings()

_docs = "/docs" if _cfg.api_docs_enabled and _cfg.environment != "production" else None

_openapi = "/openapi.json" if _docs else None


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.config.validate import require_production_config
    from app.runtime.runtime_real_auth.store import ensure_default_admin
    from app.runtime.runtime_warmup import run_startup_warmup

    if _cfg.environment == "production":
        require_production_config(_cfg)
    ensure_default_admin()
    await run_startup_warmup(_cfg)
    try:
        from app.analytics_runtime.runtime.engine import ENGINE

        ENGINE.bootstrap()
    except Exception:
        logger.warning("analytics_runtime_bootstrap_skipped", exc_info=True)
    yield


app = FastAPI(

    title=_cfg.app_name,

    version="0.1.0-mvp",

    docs_url=_docs,

    redoc_url=None,

    openapi_url=_openapi,

    lifespan=lifespan,

)



_cors_origins = [o.strip() for o in _cfg.cors_allowed_origins.split(",") if o.strip()] or ["*"]

app.add_middleware(

    CORSMiddleware,

    allow_origins=_cors_origins,

    allow_credentials="*" not in _cors_origins,

    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Forwarded-For", "X-Judge-User-Id"],

)



app.middleware("http")(https_redirect_middleware)

app.middleware("http")(judge_user_auth_middleware)

app.middleware("http")(safe_exception_middleware)

app.middleware("http")(operational_guard_middleware)

app.middleware("http")(security_headers_middleware)

app.middleware("http")(redacted_logging_middleware)





KYC_SENSITIVE_PATHS = frozenset(
    {
        "/runtime/judge/account/cpf",
        "/runtime/judge/merchant/onboarding",
    }
)


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

    if request.method == "POST" and request.url.path in KYC_SENSITIVE_PATHS:
        if not allow_request(
            "kyc_sensitive",
            client_key(request, trust_proxy=cfg.judge_trust_proxy_headers),
            limit=5,
            window_seconds=60.0,
            redis_url=cfg.redis_url,
        ):
            return build_rate_limit_response()
        return await call_next(request)

    bucket = _rate_limit_bucket(request.url.path, cfg)

    if bucket:

        if bucket == "judge":
            from app.core.rate_limit import judge_query_client_key

            rl_key, is_auth = judge_query_client_key(
                request, trust_proxy=cfg.judge_trust_proxy_headers
            )
            limit = int(
                cfg.rate_limit_auth_per_min if is_auth else cfg.rate_limit_anon_per_min
            )
            window = float(cfg.judge_rate_limit_window_seconds)
            if not allow_request(
                bucket,
                rl_key,
                limit=limit,
                window_seconds=window,
                redis_url=cfg.redis_url,
            ):
                return build_rate_limit_response()
            return await call_next(request)

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

# KYC antes de runtime_judge: /runtime/judge/{game_slug}/status capturava game_slug=account.
app.include_router(kyc_api_router)
app.include_router(identity_platform_router)
app.include_router(tournament_platform_router)
app.include_router(financial_platform_router)
app.include_router(runtime_judge_router)
app.include_router(judge_product_router)
app.include_router(judge_assistant_router)
app.include_router(judge_calls_router)
app.include_router(stripe_billing_router)
app.include_router(tournament_system_router)
app.include_router(tournament_flow_router)
app.include_router(players_ecosystem_router)
app.include_router(leagues_api_router)
app.include_router(social_api_router)
app.include_router(admin_api_router)
app.include_router(stores_api_router)
app.include_router(marketplace_api_router)
app.include_router(marketplace_sellers_api_router)
app.include_router(overlay_api_router)
app.include_router(public_api_v1_router)
app.include_router(reviews_api_router)
app.include_router(sponsorships_api_router)
app.include_router(shop_api_router)
app.include_router(buyer_api_router)
app.include_router(checkout_router)
app.include_router(seller_router)
app.include_router(seller_dashboard_router)
app.include_router(seller_ai_router)
app.include_router(platform_api_router)
app.include_router(carrier_api_router)
app.include_router(catalog_api_router)
app.include_router(catalog_games_api_router)
app.include_router(alerts_api_router)
app.include_router(gamification_api_router)
app.include_router(decks_api_router)
app.include_router(runtime_ingestion_admin_router)
app.include_router(product_analytics_runtime_router)





@app.get("/")

async def root() -> dict[str, str]:

    return {"service": get_settings().app_name, "docs": "/docs"}


