"""CRUD de amizades."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_friendship_status(
    session: AsyncSession,
    user_id: str,
    other_id: str,
) -> str:
    row = (
        await session.execute(
            text(
                """
                SELECT status FROM tcg_judge.friendships
                WHERE (requester_id = :a AND addressee_id = :b)
                   OR (requester_id = :b AND addressee_id = :a)
                LIMIT 1
                """
            ),
            {"a": user_id, "b": other_id},
        )
    ).mappings().first()
    return row["status"] if row else "none"


async def send_friend_request(session: AsyncSession, requester_id: str, addressee_id: str) -> dict[str, Any]:
    if requester_id == addressee_id:
        raise HTTPException(400, "Não pode adicionar a si mesmo")
    existing = await get_friendship_status(session, requester_id, addressee_id)
    if existing != "none":
        raise HTTPException(400, f"Relação já existe: {existing}")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.friendships (requester_id, addressee_id, status)
                VALUES (:req, :addr, 'pending')
                RETURNING *
                """
            ),
            {"req": requester_id, "addr": addressee_id},
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def accept_friend_request(session: AsyncSession, user_id: str, requester_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.friendships SET status = 'accepted', updated_at = NOW()
                WHERE requester_id = :req AND addressee_id = :addr AND status = 'pending'
                RETURNING *
                """
            ),
            {"req": requester_id, "addr": user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Solicitação não encontrada")
    await session.commit()
    return dict(row)


async def remove_friendship(session: AsyncSession, user_id: str, other_id: str) -> None:
    await session.execute(
        text(
            """
            DELETE FROM tcg_judge.friendships
            WHERE (requester_id = :a AND addressee_id = :b)
               OR (requester_id = :b AND addressee_id = :a)
            """
        ),
        {"a": user_id, "b": other_id},
    )
    await session.commit()


async def list_friends(session: AsyncSession, user_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT p.id, p.handle, p.display_name, p.avatar_url, f.status
                FROM tcg_judge.friendships f
                JOIN tcg_judge.player_profiles p ON p.id = CASE
                  WHEN f.requester_id = :uid THEN f.addressee_id ELSE f.requester_id END
                WHERE (f.requester_id = :uid OR f.addressee_id = :uid)
                  AND f.status = 'accepted'
                ORDER BY p.display_name
                """
            ),
            {"uid": user_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def list_pending_requests(session: AsyncSession, user_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT p.id, p.handle, p.display_name, p.avatar_url, f.status, f.id AS friendship_id
                FROM tcg_judge.friendships f
                JOIN tcg_judge.player_profiles p ON p.id = f.requester_id
                WHERE f.addressee_id = :uid AND f.status = 'pending'
                ORDER BY f.created_at DESC
                """
            ),
            {"uid": user_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
