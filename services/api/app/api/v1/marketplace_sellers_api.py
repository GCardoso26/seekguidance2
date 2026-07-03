"""API pública de vendedores do marketplace (/runtime/judge/marketplace/sellers)."""

from __future__ import annotations

from typing import Any, Literal

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.core.config import get_settings
from app.core.rate_limit import allow_request, build_rate_limit_response, client_key
from app.core.search.syntax_values import VALID_SYNTAX_VALUE_FIELDS, fetch_syntax_values
from app.marketplace import marketplace_sellers as sellers_svc
from app.marketplace import shop_reviews as shop_reviews_svc
from app.marketplace.seller_analytics import get_seller_analytics
from app.players.store import get_profile_by_handle
from fastapi import APIRouter, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field

router = APIRouter(tags=["marketplace-sellers"])


class ReviewCreateBody(BaseModel):
    order_id: str | None = None
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=200)
    comment: str | None = None
    condition_accuracy: int | None = Field(default=None, ge=1, le=5)
    shipping_speed: int | None = Field(default=None, ge=1, le=5)
    communication: int | None = Field(default=None, ge=1, le=5)


def _serialize_review(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row.get("id")),
        "rating": int(row.get("rating") or 0),
        "title": None,
        "comment": row.get("comment"),
        "condition_accuracy": row.get("item_as_described"),
        "shipping_speed": row.get("shipping_speed"),
        "communication": row.get("communication"),
        "is_verified_purchase": bool(row.get("order_id")),
        "helpful_count": 0,
        "reviewer_name": row.get("reviewer_name") or "Comprador",
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "store_response": row.get("store_response"),
    }


async def _store_for_username(session: DbSession, username: str) -> tuple[str, str]:
    profile = await get_profile_by_handle(session, username.strip())
    if not profile:
        raise HTTPException(404, "Vendedor não encontrado")
    from sqlalchemy import text

    store = (
        await session.execute(
            text(
                """
                SELECT id, owner_id FROM tcg_judge.stores
                WHERE owner_id = :oid
                ORDER BY shop_enabled DESC, created_at ASC
                LIMIT 1
                """
            ),
            {"oid": str(profile["id"])},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")
    return str(store["id"]), str(profile["id"])


@router.get("/runtime/judge/marketplace/sellers")
async def list_marketplace_sellers(
    session: DbSession,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort: Literal["rating", "items", "newest", "name"] = "rating",
    country_code: str | None = None,
    user_type: Literal["normal", "professional"] | None = None,
) -> dict[str, Any]:
    return await sellers_svc.list_sellers(
        session,
        page=page,
        limit=limit,
        search=search,
        sort=sort,
        country_code=country_code,
        user_type=user_type,
    )


@router.get("/runtime/judge/marketplace/sellers/{username}")
async def get_marketplace_seller_profile(session: DbSession, username: str) -> dict[str, Any]:
    return await sellers_svc.get_seller_profile(session, username)


@router.get("/runtime/judge/marketplace/sellers/{username}/products")
async def get_marketplace_seller_products(
    session: DbSession,
    username: str,
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    condition: str | None = None,
    language: str | None = None,
    foil: bool | None = None,
    signed: bool | None = None,
    altered: bool | None = None,
    graded: bool | None = None,
    price_min: int | None = None,
    price_max: int | None = None,
    game_id: str | None = None,
    sort: Literal["price_asc", "price_desc", "name", "newest"] = "price_asc",
) -> dict[str, Any]:
    return await sellers_svc.get_seller_products(
        session,
        username,
        page=page,
        limit=limit,
        condition=condition,
        language=language,
        foil=foil,
        signed=signed,
        altered=altered,
        graded=graded,
        price_min=price_min,
        price_max=price_max,
        game_id=game_id,
        sort=sort,
    )


@router.get("/runtime/judge/marketplace/sellers/{username}/reviews")
async def list_marketplace_seller_reviews(
    session: DbSession,
    username: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    sort: Literal["newest", "highest", "lowest", "helpful"] = "newest",
    verified_only: bool = False,
) -> dict[str, Any]:
    store_id, owner_id = await _store_for_username(session, username)
    filter_map = {
        "newest": "recent",
        "highest": "recent",
        "lowest": "recent",
        "helpful": "recent",
    }
    result = await shop_reviews_svc.list_store_reviews(
        session,
        store_id,
        page=page,
        limit=limit,
        filter_type=filter_map.get(sort, "recent"),
    )
    reviews = result.get("reviews") or []
    if verified_only:
        reviews = [r for r in reviews if r.get("order_id")]
    if sort == "highest":
        reviews.sort(key=lambda r: int(r.get("rating") or 0), reverse=True)
    elif sort == "lowest":
        reviews.sort(key=lambda r: int(r.get("rating") or 0))
    stats = await sellers_svc.get_seller_rating_summary(session, owner_id)
    return {
        "reviews": [_serialize_review(dict(r)) for r in reviews],
        "total": result.get("total", 0),
        "page": page,
        "limit": limit,
        "rating_summary": stats,
    }


@router.post("/runtime/judge/marketplace/sellers/{username}/reviews")
async def create_marketplace_seller_review(
    session: DbSession,
    username: str,
    body: ReviewCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    store_id, _ = await _store_for_username(session, username)
    if not body.order_id:
        raise HTTPException(400, "order_id é obrigatório para avaliar")
    row = await shop_reviews_svc.create_shop_review(
        session,
        body.order_id,
        user_id,
        rating=body.rating,
        comment=body.comment,
        shipping_speed=body.shipping_speed,
        communication=body.communication,
        item_as_described=body.condition_accuracy is not None and body.condition_accuracy >= 4,
    )
    return _serialize_review(row)


@router.get("/runtime/judge/marketplace/sellers/{username}/analytics")
async def get_marketplace_seller_analytics(session: DbSession, username: str) -> dict[str, Any]:
    return await get_seller_analytics(session, username)


@router.get("/runtime/judge/marketplace/search/syntax-values")
async def get_syntax_values(
    request: Request,
    session: DbSession,
    field: str = Query(..., min_length=1),
    game: str = Query(default="mtg"),
    q: str = Query(default=""),
    limit: int = Query(default=10, ge=1, le=20),
) -> dict[str, Any]:
    settings = get_settings()
    ip = client_key(request, trust_proxy=settings.judge_trust_proxy_headers)
    if not allow_request(
        "syntax_autocomplete",
        ip,
        limit=30,
        window_seconds=60,
        redis_url=settings.redis_url,
    ):
        return build_rate_limit_response()

    if field.strip().lower() not in VALID_SYNTAX_VALUE_FIELDS:
        raise HTTPException(400, f"Campo inválido: {field}")
    return await fetch_syntax_values(session, field=field, game=game, q=q, limit=limit)


@router.get("/runtime/judge/marketplace/search/parse")
async def parse_search_syntax(q: str = Query("")) -> dict[str, Any]:
    from app.core.search.syntax_parser import syntax_parser

    parsed = syntax_parser.parse(q)
    return {
        "text_query": parsed["text_query"],
        "filters": [
            {"field": f.field, "operator": f.operator, "value": f.value}
            for f in parsed["filters"]
        ],
        "errors": parsed["errors"],
    }
