"""Feedback da plataforma."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

FeedbackType = Literal["bug", "suggestion", "praise", "other"]
FeedbackStatus = Literal["open", "in_progress", "resolved", "closed"]


async def create_feedback(
    session: AsyncSession,
    *,
    user_id: str | None,
    type: FeedbackType,
    subject: str,
    description: str,
    attachment_url: str | None = None,
    priority: str = "low",
) -> dict[str, Any]:
    if type not in ("bug", "suggestion", "praise", "other"):
        raise HTTPException(400, "Tipo inválido")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.feedbacks
                  (user_id, type, subject, description, attachment_url, priority)
                VALUES (:uid, :type, :subject, :desc, :attach, :prio)
                RETURNING *
                """
            ),
            {
                "uid": user_id,
                "type": type,
                "subject": subject.strip(),
                "desc": description.strip(),
                "attach": attachment_url,
                "prio": priority,
            },
        )
    ).mappings().first()
    await session.commit()
    return _row(row)


def _row(r: Any) -> dict[str, Any]:
    d = dict(r)
    return {
        "id": str(d["id"]),
        "userId": d.get("user_id"),
        "type": d["type"],
        "subject": d["subject"],
        "description": d["description"],
        "attachmentUrl": d.get("attachment_url"),
        "priority": d.get("priority") or "low",
        "status": d.get("status") or "open",
        "createdAt": d["created_at"].isoformat() if d.get("created_at") else None,
        "updatedAt": d["updated_at"].isoformat() if d.get("updated_at") else None,
    }


async def list_user_feedbacks(session: AsyncSession, user_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.feedbacks
                WHERE user_id = :uid
                ORDER BY created_at DESC
                """
            ),
            {"uid": user_id},
        )
    ).mappings().all()
    return [_row(r) for r in rows]


async def list_all_feedbacks(
    session: AsyncSession,
    *,
    status: str | None = None,
    priority: str | None = None,
) -> list[dict[str, Any]]:
    where: list[str] = []
    params: dict[str, Any] = {}
    if status:
        where.append("status = :status")
        params["status"] = status
    if priority:
        where.append("priority = :priority")
        params["priority"] = priority
    clause = f"WHERE {' AND '.join(where)}" if where else ""
    rows = (
        await session.execute(
            text(f"SELECT * FROM tcg_judge.feedbacks {clause} ORDER BY created_at DESC LIMIT 200"),
            params,
        )
    ).mappings().all()
    return [_row(r) for r in rows]


async def update_status(session: AsyncSession, feedback_id: str, status: FeedbackStatus) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.feedbacks SET status = :status, updated_at = NOW()
                WHERE id = :id RETURNING *
                """
            ),
            {"id": feedback_id, "status": status},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Feedback não encontrado")
    await session.commit()
    return _row(row)
