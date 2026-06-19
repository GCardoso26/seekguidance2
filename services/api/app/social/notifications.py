"""Notificações in-app."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_notification(
    session: AsyncSession,
    *,
    user_id: str,
    type: str,
    title: str,
    content: str | None = None,
    link: str | None = None,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.notifications (user_id, type, title, content, link)
                VALUES (:uid, :type, :title, :content, :link)
                RETURNING *
                """
            ),
            {"uid": user_id, "type": type, "title": title, "content": content, "link": link},
        )
    ).mappings().first()
    await session.commit()
    return _row(row)


def _row(r: Any) -> dict[str, Any]:
    d = dict(r)
    return {
        "id": str(d["id"]),
        "userId": d["user_id"],
        "type": d["type"],
        "title": d["title"],
        "content": d.get("content"),
        "link": d.get("link"),
        "readAt": d["read_at"].isoformat() if d.get("read_at") else None,
        "createdAt": d["created_at"].isoformat() if d.get("created_at") else None,
    }


async def unread_count(session: AsyncSession, user_id: str) -> int:
    row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM tcg_judge.notifications
                WHERE user_id = :uid AND read_at IS NULL
                """
            ),
            {"uid": user_id},
        )
    ).scalar()
    return int(row or 0)


async def list_recent(session: AsyncSession, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.notifications
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT :lim
                """
            ),
            {"uid": user_id, "lim": limit},
        )
    ).mappings().all()
    return [_row(r) for r in rows]


async def mark_read(session: AsyncSession, user_id: str, notification_id: str) -> dict[str, bool]:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.notifications SET read_at = NOW()
            WHERE id = :nid AND user_id = :uid
            """
        ),
        {"nid": notification_id, "uid": user_id},
    )
    await session.commit()
    return {"read": True}
