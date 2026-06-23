"""Rotas de checkout atômico e vendedores."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.marketplace import checkout_atomic
from app.marketplace import seller_service as seller_svc
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

checkout_router = APIRouter(tags=["checkout-atomic"])
seller_router = APIRouter(tags=["sellers"])


class CheckoutInitiateBody(BaseModel):
    cart_id: str | None = None


class CheckoutCompleteBody(BaseModel):
    payment_intent_id: str | None = None
    payment_method: str | None = None


@checkout_router.post("/runtime/judge/checkout/initiate")
async def checkout_initiate(
    session: DbSession,
    body: CheckoutInitiateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    result = await checkout_atomic.initiate_checkout(session, user_id, cart_id=body.cart_id)
    return {"checkout": result}


@checkout_router.get("/runtime/judge/checkout/session/{session_id}")
async def checkout_session_get(
    session: DbSession,
    session_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    data = await checkout_atomic.get_checkout_session(session, session_id, user_id)
    return {"session": data}


@checkout_router.post("/runtime/judge/checkout/{session_id}/complete")
async def checkout_complete(
    session: DbSession,
    session_id: str,
    body: CheckoutCompleteBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    await checkout_atomic.get_active_session(session, session_id, user_id)
    result = await checkout_atomic.finalize_checkout(
        session,
        session_id,
        payment_intent_id=body.payment_intent_id,
        payment_method=body.payment_method,
    )
    return result


@checkout_router.post("/runtime/judge/checkout/{session_id}/cancel")
async def checkout_cancel(
    session: DbSession,
    session_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await checkout_atomic.cancel_checkout(session, session_id, user_id)


@checkout_router.post("/runtime/judge/checkout/expire-stale")
async def checkout_expire_stale(session: DbSession) -> dict[str, Any]:
    count = await checkout_atomic.expire_stale_sessions(session)
    return {"expired": count}


@seller_router.get("/runtime/judge/sellers/{seller_id}/profile")
async def seller_profile(session: DbSession, seller_id: str) -> dict[str, Any]:
    profile = await seller_svc.get_seller_profile(session, seller_id)
    return {"seller": profile}


@seller_router.get("/runtime/judge/sellers/{seller_id}/listings")
async def seller_listings(
    session: DbSession,
    seller_id: str,
    game_slug: str | None = None,
    condition: str | None = None,
    sort_by: str = "recent",
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    return await seller_svc.get_seller_listings(
        session,
        seller_id,
        game_slug=game_slug,
        condition=condition,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )


@seller_router.get("/runtime/judge/sellers/{seller_id}/reviews/summary")
async def seller_reviews_summary(session: DbSession, seller_id: str) -> dict[str, Any]:
    return await seller_svc.get_seller_review_summary(session, seller_id)


@seller_router.get("/runtime/judge/sellers/{seller_id}/reviews")
async def seller_reviews(
    session: DbSession,
    seller_id: str,
    rating: int | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    return await seller_svc.get_seller_reviews(
        session, seller_id, rating=rating, page=page, limit=limit
    )


@seller_router.get("/runtime/judge/sellers/{seller_id}/stats")
async def seller_stats(
    session: DbSession,
    seller_id: str,
    period: str = "30d",
) -> dict[str, Any]:
    stats = await seller_svc.get_seller_stats(session, seller_id, period=period)
    return {"stats": stats}
