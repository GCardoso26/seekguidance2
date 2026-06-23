"""Seguir jogadores."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.social import notifications as social_notifications


async def is_following(session: AsyncSession, follower_id: str, following_id: str) -> bool:
    row = (
        await session.execute(
            text(
                """
                SELECT 1 FROM tcg_judge.follows
                WHERE follower_id = :fid AND following_id = :tid
                """
            ),
            {"fid": follower_id, "tid": following_id},
        )
    ).first()
    return row is not None


async def toggle_follow(session: AsyncSession, follower_id: str, following_id: str) -> dict[str, bool]:
    if follower_id == following_id:
        return {"following": False}
    if await is_following(session, follower_id, following_id):
        await session.execute(
            text("DELETE FROM tcg_judge.follows WHERE follower_id = :fid AND following_id = :tid"),
            {"fid": follower_id, "tid": following_id},
        )
        await session.commit()
        return {"following": False}
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.follows (follower_id, following_id)
            VALUES (:fid, :tid) ON CONFLICT DO NOTHING
            """
        ),
        {"fid": follower_id, "tid": following_id},
    )
    profile = (
        await session.execute(
            text("SELECT display_name, handle FROM tcg_judge.player_profiles WHERE id = :id"),
            {"id": follower_id},
        )
    ).mappings().first()
    name = (profile or {}).get("display_name") or (profile or {}).get("handle") or "Alguém"
    await social_notifications.create_notification(
        session,
        user_id=following_id,
        type="follow",
        title="Novo seguidor",
        content=f"{name} começou a seguir você",
        link=f"/player/{follower_id}",
    )
    return {"following": True}


async def follower_count(session: AsyncSession, user_id: str) -> int:
    row = (
        await session.execute(
            text("SELECT COUNT(*) FROM tcg_judge.follows WHERE following_id = :uid"),
            {"uid": user_id},
        )
    ).scalar()
    return int(row or 0)


async def list_following(session: AsyncSession, follower_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT f.following_id AS id, p.handle, p.display_name, p.avatar_url,
                       s.name AS shop_name, s.average_rating, s.review_count
                FROM tcg_judge.follows f
                JOIN tcg_judge.player_profiles p ON p.id = f.following_id
                LEFT JOIN tcg_judge.stores s ON s.owner_id = f.following_id
                WHERE f.follower_id = :fid
                ORDER BY f.created_at DESC
                LIMIT :lim
                """
            ),
            {"fid": follower_id, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def get_follow_stats(
    session: AsyncSession,
    target_id: str,
    viewer_id: str | None = None,
) -> dict[str, Any]:
    following = False
    if viewer_id:
        following = await is_following(session, viewer_id, target_id)
    count = await follower_count(session, target_id)
    return {"following": following, "followerCount": count}
