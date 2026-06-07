"""API de lojas verificadas."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.reviews.review import list_reviews
from app.stores import store as store_svc
from app.stores.subscriptions import subscribe_store
from app.stores.verification import request_verification
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["stores"])


class StoreCreateBody(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    slug: str = Field(min_length=3, max_length=50)
    description: str | None = None
    email: str
    city: str | None = None
    country: str = "BR"


class StoreUpdateBody(BaseModel):
    name: str | None = None
    description: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    website: str | None = None
    discord: str | None = None
    city: str | None = None


class VerifyBody(BaseModel):
    documents: list[str] | None = None


class SubscribeBody(BaseModel):
    plan: str = Field(pattern="^(pro|enterprise)$")


@router.post("/runtime/judge/stores")
async def create_store(
    session: DbSession,
    body: StoreCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await store_svc.create_store(
        session, user_id, name=body.name, slug=body.slug,
        description=body.description, email=body.email, city=body.city, country=body.country,
    )


@router.get("/runtime/judge/stores")
async def list_stores(
    session: DbSession,
    city: str | None = None,
    country: str | None = None,
    verified_only: bool = False,
) -> list[dict[str, Any]]:
    return await store_svc.list_stores(session, city=city, country=country, verified_only=verified_only)


@router.get("/runtime/judge/stores/{slug}")
async def get_store(session: DbSession, slug: str) -> dict[str, Any]:
    s = await store_svc.get_store_by_slug(session, slug)
    if not s:
        raise HTTPException(404, "Loja não encontrada")
    tournaments = await store_svc.get_store_tournaments(session, str(s["id"]))
    reviews = await list_reviews(session, "store", str(s["id"]))
    return {"store": s, "tournaments": tournaments, "reviews": reviews}


@router.put("/runtime/judge/stores/{store_id}")
async def update_store(
    session: DbSession,
    store_id: str,
    body: StoreUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await store_svc.update_store(session, store_id, user_id, body.model_dump(exclude_none=True))


@router.post("/runtime/judge/stores/{store_id}/verify")
async def verify_store(
    session: DbSession,
    store_id: str,
    body: VerifyBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await request_verification(session, store_id, user_id, documents=body.documents)


@router.post("/runtime/judge/stores/{store_id}/subscribe")
async def store_subscribe(
    session: DbSession,
    store_id: str,
    body: SubscribeBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await subscribe_store(session, store_id, user_id, body.plan)


@router.get("/runtime/judge/stores/{store_id}/tournaments")
async def store_tournaments(session: DbSession, store_id: str) -> list[dict[str, Any]]:
    return await store_svc.get_store_tournaments(session, store_id)


@router.get("/runtime/judge/stores/{store_id}/reviews")
async def store_reviews(session: DbSession, store_id: str) -> list[dict[str, Any]]:
    return await list_reviews(session, "store", store_id)
