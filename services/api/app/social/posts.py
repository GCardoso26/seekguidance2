"""Posts, votos e comentários de comunidades."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

SortMode = Literal["hot", "new", "top"]


def _row_post(row: Any, *, author_handle: str | None = None, author_name: str | None = None) -> dict[str, Any]:
    d = dict(row)
    return {
        "id": str(d["id"]),
        "communityId": str(d["community_id"]),
        "title": d["title"],
        "content": d.get("content") or "",
        "imageUrl": d.get("image_url"),
        "voteCount": int(d.get("vote_count") or 0),
        "commentCount": int(d.get("comment_count") or 0),
        "authorId": d["author_id"],
        "authorHandle": author_handle,
        "authorName": author_name,
        "createdAt": d["created_at"].isoformat() if d.get("created_at") else None,
        "updatedAt": d["updated_at"].isoformat() if d.get("updated_at") else None,
    }


async def list_posts(
    session: AsyncSession,
    *,
    community_id: str | None = None,
    author_id: str | None = None,
    sort: SortMode = "hot",
    limit: int = 30,
    offset: int = 0,
) -> list[dict[str, Any]]:
    order = {
        "new": "p.created_at DESC",
        "top": "p.vote_count DESC, p.created_at DESC",
        "hot": "p.vote_count DESC, p.comment_count DESC, p.created_at DESC",
    }[sort]
    where: list[str] = []
    params: dict[str, Any] = {"lim": limit, "off": offset}
    if community_id:
        where.append("p.community_id = :cid")
        params["cid"] = community_id
    if author_id:
        where.append("p.author_id = :aid")
        params["aid"] = author_id
    clause = f"WHERE {' AND '.join(where)}" if where else ""
    rows = (
        await session.execute(
            text(
                f"""
                SELECT p.*, pp.handle AS author_handle, pp.display_name AS author_name
                FROM tcg_judge.community_posts p
                JOIN tcg_judge.player_profiles pp ON pp.id = p.author_id
                {clause}
                ORDER BY {order}
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()
    return [_row_post(r, author_handle=r.get("author_handle"), author_name=r.get("author_name")) for r in rows]


async def get_post(session: AsyncSession, post_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT p.*, pp.handle AS author_handle, pp.display_name AS author_name
                FROM tcg_judge.community_posts p
                JOIN tcg_judge.player_profiles pp ON pp.id = p.author_id
                WHERE p.id = :id
                """
            ),
            {"id": post_id},
        )
    ).mappings().first()
    if not row:
        return None
    return _row_post(row, author_handle=row.get("author_handle"), author_name=row.get("author_name"))


async def create_post(
    session: AsyncSession,
    author_id: str,
    *,
    community_id: str,
    title: str,
    content: str,
    image_url: str | None = None,
) -> dict[str, Any]:
    comm = (
        await session.execute(
            text("SELECT id FROM tcg_judge.communities WHERE id = :id"),
            {"id": community_id},
        )
    ).mappings().first()
    if not comm:
        raise HTTPException(404, "Comunidade não encontrada")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.community_posts
                  (community_id, author_id, title, content, image_url)
                VALUES (:cid, :aid, :title, :content, :img)
                RETURNING *
                """
            ),
            {
                "cid": community_id,
                "aid": author_id,
                "title": title.strip(),
                "content": content.strip(),
                "img": image_url,
            },
        )
    ).mappings().first()
    await session.commit()
    post = await get_post(session, str(row["id"]))
    return post or _row_post(row)


async def vote_post(session: AsyncSession, post_id: str, user_id: str, value: int) -> dict[str, Any]:
    if value not in (-1, 1):
        raise HTTPException(400, "Voto inválido")
    exists = (
        await session.execute(
            text("SELECT id FROM tcg_judge.community_posts WHERE id = :id"),
            {"id": post_id},
        )
    ).mappings().first()
    if not exists:
        raise HTTPException(404, "Post não encontrado")
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.post_votes (post_id, user_id, value)
            VALUES (:pid, :uid, :val)
            ON CONFLICT (post_id, user_id) DO UPDATE SET value = EXCLUDED.value
            """
        ),
        {"pid": post_id, "uid": user_id, "val": value},
    )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.community_posts SET vote_count = (
              SELECT COALESCE(SUM(value), 0) FROM tcg_judge.post_votes WHERE post_id = :pid
            ), updated_at = NOW() WHERE id = :pid
            """
        ),
        {"pid": post_id},
    )
    await session.commit()
    post = await get_post(session, post_id)
    return post or {"id": post_id}


async def list_comments(session: AsyncSession, post_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT c.*, pp.handle AS author_handle, pp.display_name AS author_name
                FROM tcg_judge.post_comments c
                JOIN tcg_judge.player_profiles pp ON pp.id = c.author_id
                WHERE c.post_id = :pid
                ORDER BY c.created_at ASC
                """
            ),
            {"pid": post_id},
        )
    ).mappings().all()
    return [
        {
            "id": str(r["id"]),
            "postId": str(r["post_id"]),
            "parentId": str(r["parent_id"]) if r.get("parent_id") else None,
            "content": r["content"],
            "authorId": r["author_id"],
            "authorHandle": r.get("author_handle"),
            "authorName": r.get("author_name"),
            "createdAt": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


async def create_comment(
    session: AsyncSession,
    author_id: str,
    *,
    post_id: str,
    content: str,
    parent_id: str | None = None,
) -> dict[str, Any]:
    post = (
        await session.execute(
            text("SELECT id FROM tcg_judge.community_posts WHERE id = :id"),
            {"id": post_id},
        )
    ).mappings().first()
    if not post:
        raise HTTPException(404, "Post não encontrado")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.post_comments (post_id, author_id, content, parent_id)
                VALUES (:pid, :aid, :content, :parent)
                RETURNING *
                """
            ),
            {"pid": post_id, "aid": author_id, "content": content.strip(), "parent": parent_id},
        )
    ).mappings().first()
    await session.execute(
        text(
            """
            UPDATE tcg_judge.community_posts SET comment_count = comment_count + 1, updated_at = NOW()
            WHERE id = :pid
            """
        ),
        {"pid": post_id},
    )
    await session.commit()
    return {
        "id": str(row["id"]),
        "postId": post_id,
        "parentId": parent_id,
        "content": row["content"],
        "authorId": author_id,
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else None,
    }
