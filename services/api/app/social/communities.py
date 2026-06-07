"""Comunidades de jogadores."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_community(
    session: AsyncSession,
    creator_id: str,
    *,
    name: str,
    description: str | None = None,
    game_code: str | None = None,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.communities (name, description, game_code, created_by, member_count)
                VALUES (:name, :desc, :gc, :cid, 1)
                RETURNING *
                """
            ),
            {"name": name, "desc": description, "gc": game_code, "cid": creator_id},
        )
    ).mappings().first()
    comm = dict(row) if row else {}
    if comm:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.community_members (community_id, player_id, role)
                VALUES (:cid, :pid, 'admin')
                """
            ),
            {"cid": comm["id"], "pid": creator_id},
        )
    await session.commit()
    return comm


async def join_community(session: AsyncSession, community_id: str, player_id: str) -> dict[str, Any]:
    exists = (
        await session.execute(
            text("SELECT id FROM tcg_judge.communities WHERE id = :id"),
            {"id": community_id},
        )
    ).mappings().first()
    if not exists:
        raise HTTPException(404, "Comunidade não encontrada")
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.community_members (community_id, player_id)
            VALUES (:cid, :pid) ON CONFLICT DO NOTHING
            """
        ),
        {"cid": community_id, "pid": player_id},
    )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.communities SET member_count = (
              SELECT COUNT(*) FROM tcg_judge.community_members WHERE community_id = :cid
            ) WHERE id = :cid
            """
        ),
        {"cid": community_id},
    )
    await session.commit()
    return {"communityId": community_id, "joined": True}


async def list_communities(session: AsyncSession, *, limit: int = 20) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT c.*, p.handle AS creator_handle
                FROM tcg_judge.communities c
                JOIN tcg_judge.player_profiles p ON p.id = c.created_by
                ORDER BY c.member_count DESC
                LIMIT :lim
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def list_members(session: AsyncSession, community_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT cm.role, cm.joined_at, p.id, p.handle, p.display_name, p.avatar_url
                FROM tcg_judge.community_members cm
                JOIN tcg_judge.player_profiles p ON p.id = cm.player_id
                WHERE cm.community_id = :cid
                ORDER BY cm.joined_at
                """
            ),
            {"cid": community_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
