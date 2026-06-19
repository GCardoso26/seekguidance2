"""Newsletter — inscrição e arquivo."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def subscribe(
    session: AsyncSession,
    *,
    email: str,
    tcg_ids: list[str] | None = None,
) -> dict[str, Any]:
    clean_email = email.strip().lower()
    if "@" not in clean_email:
        raise HTTPException(400, "E-mail inválido")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.newsletter_subscribers (email, tcg_ids)
                VALUES (:email, :tcgs)
                ON CONFLICT (email) DO UPDATE SET
                  tcg_ids = EXCLUDED.tcg_ids,
                  unsubscribed_at = NULL,
                  subscribed_at = NOW()
                RETURNING id, email, tcg_ids, subscribed_at
                """
            ),
            {"email": clean_email, "tcgs": tcg_ids or []},
        )
    ).mappings().first()
    await session.commit()
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "tcgIds": list(row["tcg_ids"] or []),
        "subscribedAt": row["subscribed_at"].isoformat() if row.get("subscribed_at") else None,
    }


async def list_archive(session: AsyncSession, limit: int = 50) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT id, title, content, sent_at, created_at
                FROM tcg_judge.newsletters
                WHERE sent_at IS NOT NULL
                ORDER BY sent_at DESC
                LIMIT :lim
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()
    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "content": r["content"],
            "sentAt": r["sent_at"].isoformat() if r.get("sent_at") else None,
            "createdAt": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


async def create_draft(session: AsyncSession, *, title: str, content: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.newsletters (title, content)
                VALUES (:title, :content)
                RETURNING *
                """
            ),
            {"title": title.strip(), "content": content.strip()},
        )
    ).mappings().first()
    await session.commit()
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "content": row["content"],
        "sentAt": None,
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else None,
    }


async def mark_sent(session: AsyncSession, newsletter_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.newsletters SET sent_at = NOW()
                WHERE id = :id
                RETURNING *
                """
            ),
            {"id": newsletter_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Newsletter não encontrada")
    await session.commit()
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "sentAt": row["sent_at"].isoformat() if row.get("sent_at") else None,
    }
