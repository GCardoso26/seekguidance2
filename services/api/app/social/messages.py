"""Mensagens entre jogadores."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.social.friendships import get_friendship_status


async def send_message(
    session: AsyncSession,
    sender_id: str,
    receiver_id: str,
    content: str,
) -> dict[str, Any]:
    if not content.strip():
        raise HTTPException(400, "Mensagem vazia")
    status = await get_friendship_status(session, sender_id, receiver_id)
    if status != "accepted":
        raise HTTPException(403, "Apenas amigos podem enviar mensagens")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.messages (sender_id, receiver_id, content)
                VALUES (:s, :r, :c)
                RETURNING *
                """
            ),
            {"s": sender_id, "r": receiver_id, "c": content.strip()},
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def get_conversation(
    session: AsyncSession,
    user_id: str,
    other_id: str,
    *,
    limit: int = 50,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.messages
                WHERE (sender_id = :a AND receiver_id = :b)
                   OR (sender_id = :b AND receiver_id = :a)
                ORDER BY created_at DESC
                LIMIT :lim
                """
            ),
            {"a": user_id, "b": other_id, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in reversed(rows)]


async def mark_read(session: AsyncSession, user_id: str, sender_id: str) -> int:
    result = await session.execute(
        text(
            """
            UPDATE tcg_judge.messages SET read = true
            WHERE receiver_id = :uid AND sender_id = :sid AND read = false
            """
        ),
        {"uid": user_id, "sid": sender_id},
    )
    await session.commit()
    return result.rowcount or 0


async def unread_counts(session: AsyncSession, user_id: str) -> dict[str, int]:
    rows = (
        await session.execute(
            text(
                """
                SELECT sender_id, COUNT(*) AS cnt
                FROM tcg_judge.messages
                WHERE receiver_id = :uid AND read = false
                GROUP BY sender_id
                """
            ),
            {"uid": user_id},
        )
    ).mappings().all()
    return {r["sender_id"]: int(r["cnt"]) for r in rows}
