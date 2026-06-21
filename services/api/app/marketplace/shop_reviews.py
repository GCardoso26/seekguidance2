"""Avaliações pós-compra no marketplace."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_notifications import notify_shop_event


def _bayesian_average(ratings: list[int], prior_mean: float = 4.2, prior_weight: int = 5) -> float:
    if not ratings:
        return prior_mean
    n = len(ratings)
    avg = sum(ratings) / n
    return round((prior_weight * prior_mean + n * avg) / (prior_weight + n), 2)


async def create_shop_review(
    session: AsyncSession,
    order_id: str,
    reviewer_id: str,
    *,
    rating: int,
    comment: str | None = None,
    photos: list[str] | None = None,
) -> dict[str, Any]:
    if rating < 1 or rating > 5:
        raise HTTPException(400, "Nota deve ser entre 1 e 5")

    order = (
        await session.execute(
            text(
                """
                SELECT o.*, s.owner_id AS store_owner_id
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE o.id = :id AND o.buyer_id = :uid
                """
            ),
            {"id": order_id, "uid": reviewer_id},
        )
    ).mappings().first()
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    if order["status"] not in {"delivered", "paid", "shipped"}:
        raise HTTPException(400, "Avalie após receber o pedido")

    existing = (
        await session.execute(
            text("SELECT id FROM tcg_judge.shop_reviews WHERE order_id = :oid"),
            {"oid": order_id},
        )
    ).mappings().first()
    if existing:
        raise HTTPException(409, "Pedido já avaliado")

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.shop_reviews
                  (order_id, reviewer_id, store_id, rating, comment, photos)
                VALUES (:oid, :uid, :sid, :rating, :comment, :photos)
                RETURNING *
                """
            ),
            {
                "oid": order_id,
                "uid": reviewer_id,
                "sid": str(order["store_id"]),
                "rating": rating,
                "comment": comment,
                "photos": photos or [],
            },
        )
    ).mappings().first()

    ratings_rows = (
        await session.execute(
            text(
                """
                SELECT rating FROM tcg_judge.shop_reviews
                WHERE store_id = :sid AND is_visible = TRUE
                """
            ),
            {"sid": str(order["store_id"])},
        )
    ).mappings().all()
    ratings = [int(r["rating"]) for r in ratings_rows]
    avg = _bayesian_average(ratings)

    await session.execute(
        text(
            """
            UPDATE tcg_judge.stores
            SET average_rating = :avg, review_count = :cnt, updated_at = NOW()
            WHERE id = :sid
            """
        ),
        {"avg": avg, "cnt": len(ratings), "sid": str(order["store_id"])},
    )

    await notify_shop_event(
        session,
        "shop:review_received",
        store_owner_id=str(order["store_owner_id"]),
        body=f"Nova avaliação: {rating}/5 estrelas",
        data={"order_id": order_id, "rating": rating},
    )
    await session.commit()
    return dict(row) if row else {}


async def update_shop_review(
    session: AsyncSession,
    review_id: str,
    reviewer_id: str,
    *,
    comment: str | None = None,
    photos: list[str] | None = None,
) -> dict[str, Any]:
    review = (
        await session.execute(
            text(
                """
                SELECT r.*, s.owner_id AS store_owner_id
                FROM tcg_judge.shop_reviews r
                JOIN tcg_judge.stores s ON s.id = r.store_id
                WHERE r.id = :id AND r.reviewer_id = :uid
                """
            ),
            {"id": review_id, "uid": reviewer_id},
        )
    ).mappings().first()
    if not review:
        raise HTTPException(404, "Avaliação não encontrada")

    created = review["created_at"]
    if isinstance(created, datetime):
        if datetime.now(UTC) - created.replace(tzinfo=created.tzinfo or UTC) > timedelta(days=7):
            raise HTTPException(400, "Prazo de edição expirado (7 dias)")
    if int(review.get("edit_count") or 0) >= 1:
        raise HTTPException(400, "Avaliação já foi editada")

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_reviews
                SET comment = :comment,
                    photos = :photos,
                    original_comment = COALESCE(original_comment, comment),
                    edited_at = NOW(),
                    edit_count = edit_count + 1
                WHERE id = :id
                RETURNING *
                """
            ),
            {
                "id": review_id,
                "comment": comment,
                "photos": photos or review.get("photos") or [],
            },
        )
    ).mappings().first()

    await notify_shop_event(
        session,
        "shop:review_edited",
        store_owner_id=str(review["store_owner_id"]),
        body="Uma avaliação da sua loja foi editada",
        data={"review_id": review_id, "order_id": str(review["order_id"])},
    )
    await session.commit()
    return dict(row) if row else {}


async def get_review_by_order(
    session: AsyncSession, order_id: str, user_id: str
) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT r.* FROM tcg_judge.shop_reviews r
                JOIN tcg_judge.shop_orders o ON o.id = r.order_id
                WHERE r.order_id = :oid AND o.buyer_id = :uid
                """
            ),
            {"oid": order_id, "uid": user_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def get_store_review_stats(session: AsyncSession, store_id: str) -> dict[str, Any]:
    rows = (
        await session.execute(
            text(
                """
                SELECT rating, COUNT(*) AS cnt
                FROM tcg_judge.shop_reviews
                WHERE store_id = :sid AND is_visible = TRUE
                GROUP BY rating ORDER BY rating DESC
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()
    store = (
        await session.execute(
            text("SELECT average_rating, review_count FROM tcg_judge.stores WHERE id = :id"),
            {"id": store_id},
        )
    ).mappings().first()
    distribution = {int(r["rating"]): int(r["cnt"]) for r in rows}
    total = sum(distribution.values())
    avg = float(store["average_rating"]) if store else 0.0
    return {
        "average_rating": avg,
        "total_reviews": int(store["review_count"]) if store else total,
        "distribution": distribution,
        "top_rated": avg >= 4.8 and total >= 50,
    }


async def list_store_reviews(
    session: AsyncSession,
    store_id: str,
    *,
    limit: int = 10,
    page: int = 1,
    filter_type: str = "recent",
) -> dict[str, Any]:
    order_sql = "r.created_at DESC"
    if filter_type == "photos":
        order_sql = "CARDINALITY(r.photos) DESC, r.created_at DESC"
    elif filter_type == "response":
        order_sql = "r.store_responded_at DESC NULLS LAST, r.created_at DESC"

    offset = (max(1, page) - 1) * limit
    rows = (
        await session.execute(
            text(
                f"""
                SELECT r.*, p.display_name AS reviewer_name
                FROM tcg_judge.shop_reviews r
                LEFT JOIN tcg_judge.player_profiles p ON p.id = r.reviewer_id
                WHERE r.store_id = :sid AND r.is_visible = TRUE
                ORDER BY {order_sql}
                LIMIT :lim OFFSET :off
                """
            ),
            {"sid": store_id, "lim": min(50, limit), "off": offset},
        )
    ).mappings().all()
    count = (
        await session.execute(
            text("SELECT COUNT(*) AS c FROM tcg_judge.shop_reviews WHERE store_id = :sid AND is_visible = TRUE"),
            {"sid": store_id},
        )
    ).mappings().first()
    return {
        "reviews": [dict(r) for r in rows],
        "total": int(count["c"]) if count else 0,
        "page": page,
        "limit": limit,
    }


async def flag_review(session: AsyncSession, review_id: str, owner_id: str, reason: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_reviews r
                SET is_flagged = TRUE, flag_reason = :reason
                FROM tcg_judge.stores s
                WHERE r.id = :id AND r.store_id = s.id AND s.owner_id = :oid
                RETURNING r.*
                """
            ),
            {"id": review_id, "reason": reason.strip(), "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Avaliação não encontrada")
    await session.commit()
    return dict(row)


async def list_owner_reviews(session: AsyncSession, store_id: str, owner_id: str) -> list[dict[str, Any]]:
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")
    rows = (
        await session.execute(
            text(
                """
                SELECT r.*, p.display_name AS reviewer_name,
                  (SELECT i.product_name FROM tcg_judge.shop_order_items i WHERE i.order_id = r.order_id LIMIT 1) AS product_name
                FROM tcg_judge.shop_reviews r
                LEFT JOIN tcg_judge.player_profiles p ON p.id = r.reviewer_id
                WHERE r.store_id = :sid
                ORDER BY r.created_at DESC
                LIMIT 100
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def list_store_reviews_public(
    session: AsyncSession, store_id: str, *, limit: int = 20
) -> list[dict[str, Any]]:
    result = await list_store_reviews(session, store_id, limit=limit, page=1)
    return result["reviews"]


async def respond_to_review(
    session: AsyncSession, review_id: str, owner_id: str, response: str
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_reviews r
                SET store_response = :resp, store_responded_at = NOW()
                FROM tcg_judge.stores s
                WHERE r.id = :id AND r.store_id = s.id AND s.owner_id = :oid
                RETURNING r.*
                """
            ),
            {"id": review_id, "resp": response.strip(), "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Avaliação não encontrada")
    await session.commit()
    return dict(row)
