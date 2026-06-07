"""Sistema de reviews/ratings."""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_review(
    session: AsyncSession,
    reviewer_id: str,
    *,
    target_type: str,
    target_id: str,
    rating: int,
    comment: str,
    title: str | None = None,
    categories: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not 1 <= rating <= 5:
        raise HTTPException(400, "Rating deve ser 1-5")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.reviews (
                  reviewer_id, target_type, target_id, rating, title, comment, categories
                ) VALUES (
                  :rid, :tt, :tid, :rating, :title, :comment, CAST(:cat AS jsonb)
                )
                ON CONFLICT (reviewer_id, target_type, target_id) DO UPDATE SET
                  rating = EXCLUDED.rating,
                  comment = EXCLUDED.comment,
                  title = EXCLUDED.title,
                  categories = EXCLUDED.categories
                RETURNING *
                """
            ),
            {
                "rid": reviewer_id,
                "tt": target_type,
                "tid": target_id,
                "rating": rating,
                "title": title,
                "comment": comment,
                "cat": json.dumps(categories or {}),
            },
        )
    ).mappings().first()

    if target_type == "store":
        await session.execute(
            text(
                """
                UPDATE tcg_judge.stores SET
                  average_rating = (
                    SELECT ROUND(AVG(rating)::numeric, 2) FROM tcg_judge.reviews
                    WHERE target_type = 'store' AND target_id = :tid AND NOT reported
                  ),
                  review_count = (
                    SELECT COUNT(*) FROM tcg_judge.reviews
                    WHERE target_type = 'store' AND target_id = :tid AND NOT reported
                  )
                WHERE id = :tid::uuid
                """
            ),
            {"tid": target_id},
        )
    elif target_type == "decklist":
        await session.execute(
            text(
                """
                UPDATE tcg_judge.marketplace_decklists SET
                  average_rating = (
                    SELECT ROUND(AVG(rating)::numeric, 2) FROM tcg_judge.reviews
                    WHERE target_type = 'decklist' AND target_id = :tid AND NOT reported
                  )
                WHERE id = :tid::uuid
                """
            ),
            {"tid": target_id},
        )

    await session.commit()
    return dict(row) if row else {}


async def list_reviews(
    session: AsyncSession,
    target_type: str,
    target_id: str,
    *,
    limit: int = 20,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT r.*, p.handle, p.display_name, p.avatar_url
                FROM tcg_judge.reviews r
                JOIN tcg_judge.player_profiles p ON p.id = r.reviewer_id
                WHERE r.target_type = :tt AND r.target_id = :tid AND NOT r.reported
                ORDER BY r.helpful_count DESC, r.created_at DESC
                LIMIT :lim
                """
            ),
            {"tt": target_type, "tid": target_id, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def upvote_review(session: AsyncSession, review_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.reviews SET helpful_count = helpful_count + 1
                WHERE id = :id RETURNING helpful_count
                """
            ),
            {"id": review_id},
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}
