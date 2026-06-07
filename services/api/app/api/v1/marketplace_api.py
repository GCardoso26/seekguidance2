"""API do marketplace de decklists."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.marketplace.decklists import create_listing, get_listing, search_listings
from app.marketplace.sales import purchase_decklist
from app.reviews.review import list_reviews
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["marketplace"])


class ListingCreateBody(BaseModel):
    name: str
    game_code: str
    format_code: str
    decklist_data: dict[str, Any]
    price_cents: int = Field(ge=500, le=5000)
    description: str | None = None
    tournament_id: str | None = None
    tags: list[str] | None = None


@router.get("/runtime/judge/marketplace/decklists")
async def search_marketplace(
    session: DbSession,
    q: str | None = None,
    game: str | None = None,
    format: str | None = None,
    tag: str | None = None,
) -> list[dict[str, Any]]:
    return await search_listings(session, query=q, game=game, format_code=format, tag=tag)


@router.post("/runtime/judge/marketplace/decklists")
async def create_marketplace_listing(
    session: DbSession,
    body: ListingCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await create_listing(
        session, user_id, name=body.name, game_code=body.game_code,
        format_code=body.format_code, decklist_data=body.decklist_data,
        price_cents=body.price_cents, description=body.description,
        tournament_id=body.tournament_id, tags=body.tags,
    )


@router.get("/runtime/judge/marketplace/decklists/{listing_id}")
async def get_marketplace_listing(session: DbSession, listing_id: str) -> dict[str, Any]:
    item = await get_listing(session, listing_id)
    if not item:
        raise HTTPException(404, "Decklist não encontrada")
    reviews = await list_reviews(session, "decklist", listing_id)
    return {"listing": item, "reviews": reviews}


@router.post("/runtime/judge/marketplace/decklists/{listing_id}/purchase")
async def purchase_listing(
    session: DbSession,
    listing_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await purchase_decklist(session, listing_id, user_id)
