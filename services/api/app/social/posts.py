"""Posts, votos e comentários de comunidades."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

SortMode = Literal["hot", "new", "top"]
TopPeriod = Literal["week", "month", "year", "all"]


def _image_urls(d: dict[str, Any]) -> list[str]:
    urls = list(d.get("image_urls") or [])
    legacy = d.get("image_url")
    if legacy and legacy not in urls:
        urls.insert(0, legacy)
    return urls


def _row_post(row: Any, *, author_handle: str | None = None, author_name: str | None = None) -> dict[str, Any]:
    d = dict(row)
    return {
        "id": str(d["id"]),
        "communityId": str(d["community_id"]),
        "title": d["title"],
        "content": d.get("content") or "",
        "imageUrl": d.get("image_url"),
        "imageUrls": _image_urls(d),
        "tags": list(d.get("tags") or []),
        "isPinned": bool(d.get("is_pinned")),
        "voteCount": int(d.get("vote_count") or 0),
        "commentCount": int(d.get("comment_count") or 0),
        "authorId": d["author_id"],
        "authorHandle": author_handle,
        "authorName": author_name,
        "createdAt": d["created_at"].isoformat() if d.get("created_at") else None,
        "updatedAt": d["updated_at"].isoformat() if d.get("updated_at") else None,
    }


def _order_clause(sort: SortMode) -> str:
    if sort == "new":
        return "p.is_pinned DESC, p.created_at DESC"
    if sort == "top":
        return "p.is_pinned DESC, p.vote_count DESC, p.created_at DESC"
    return (
        "p.is_pinned DESC, "
        "((p.vote_count * 2 + p.comment_count)::float / "
        "POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0 + 2, 1.5)) DESC"
    )


async def list_posts(
    session: AsyncSession,
    *,
    community_id: str | None = None,
    author_id: str | None = None,
    following_user_id: str | None = None,
    tag: str | None = None,
    sort: SortMode = "hot",
    period: TopPeriod = "all",
    limit: int = 30,
    cursor: str | None = None,
) -> dict[str, Any]:
    where: list[str] = []
    params: dict[str, Any] = {"lim": limit}
    join = ""
    if community_id:
        where.append("p.community_id = :cid")
        params["cid"] = community_id
    if author_id:
        where.append("p.author_id = :aid")
        params["aid"] = author_id
    if following_user_id:
        join = "JOIN tcg_judge.follows f ON f.following_id = p.author_id AND f.follower_id = :fid"
        params["fid"] = following_user_id
    if tag:
        where.append(":tag = ANY(p.tags)")
        params["tag"] = tag.strip().lower()
    if sort == "top" and period != "all":
        interval = {"week": "7 days", "month": "30 days", "year": "365 days"}[period]
        where.append(f"p.created_at > NOW() - INTERVAL '{interval}'")
    if cursor:
        where.append("p.created_at < :cursor::timestamptz")
        params["cursor"] = cursor
    clause = f"WHERE {' AND '.join(where)}" if where else ""
    order = _order_clause(sort)
    rows = (
        await session.execute(
            text(
                f"""
                SELECT p.*, pp.handle AS author_handle, pp.display_name AS author_name
                FROM tcg_judge.community_posts p
                JOIN tcg_judge.player_profiles pp ON pp.id = p.author_id
                {join}
                {clause}
                ORDER BY {order}
                LIMIT :lim
                """
            ),
            params,
        )
    ).mappings().all()
    items = [_row_post(r, author_handle=r.get("author_handle"), author_name=r.get("author_name")) for r in rows]
    next_cursor = items[-1]["createdAt"] if len(items) >= limit and items else None
    return {"items": items, "nextCursor": next_cursor}


async def list_tags(session: AsyncSession, *, q: str = "", limit: int = 20) -> list[str]:
    pattern = f"%{q.strip().lower()}%" if q.strip() else "%"
    rows = (
        await session.execute(
            text(
                """
                SELECT DISTINCT tag
                FROM tcg_judge.community_posts, unnest(tags) AS tag
                WHERE tag ILIKE :pat
                ORDER BY tag
                LIMIT :lim
                """
            ),
            {"pat": pattern, "lim": limit},
        )
    ).scalars().all()
    return [str(r) for r in rows if r]


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
    image_urls: list[str] | None = None,
    tags: list[str] | None = None,
) -> dict[str, Any]:
    comm = (
        await session.execute(
            text("SELECT id FROM tcg_judge.communities WHERE id = :id"),
            {"id": community_id},
        )
    ).mappings().first()
    if not comm:
        raise HTTPException(404, "Comunidade não encontrada")
    imgs = list(image_urls or [])
    if image_url and image_url not in imgs:
        imgs.insert(0, image_url)
    if len(imgs) > 4:
        raise HTTPException(400, "Máximo de 4 imagens por post")
    clean_tags = [t.strip().lower() for t in (tags or []) if t.strip()][:10]
    primary_img = imgs[0] if imgs else image_url
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.community_posts
                  (community_id, author_id, title, content, image_url, image_urls, tags)
                VALUES (:cid, :aid, :title, :content, :img, :imgs, :tags)
                RETURNING *
                """
            ),
            {
                "cid": community_id,
                "aid": author_id,
                "title": title.strip(),
                "content": content.strip(),
                "img": primary_img,
                "imgs": imgs,
                "tags": clean_tags,
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


async def toggle_saved_post(session: AsyncSession, post_id: str, user_id: str) -> dict[str, bool]:
    row = (
        await session.execute(
            text(
                """
                SELECT 1 FROM tcg_judge.saved_posts WHERE user_id = :uid AND post_id = :pid
                """
            ),
            {"uid": user_id, "pid": post_id},
        )
    ).first()
    if row:
        await session.execute(
            text("DELETE FROM tcg_judge.saved_posts WHERE user_id = :uid AND post_id = :pid"),
            {"uid": user_id, "pid": post_id},
        )
        await session.commit()
        return {"saved": False}
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.saved_posts (user_id, post_id) VALUES (:uid, :pid)
            ON CONFLICT DO NOTHING
            """
        ),
        {"uid": user_id, "pid": post_id},
    )
    await session.commit()
    return {"saved": True}


async def report_post(
    session: AsyncSession,
    post_id: str,
    user_id: str,
    *,
    reason: str,
    details: str | None = None,
) -> dict[str, Any]:
    if reason not in ("spam", "offensive", "incorrect", "other"):
        raise HTTPException(400, "Motivo inválido")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.post_reports (post_id, reporter_id, reason, details)
                VALUES (:pid, :uid, :reason, :details)
                ON CONFLICT (post_id, reporter_id) DO UPDATE SET reason = EXCLUDED.reason, details = EXCLUDED.details
                RETURNING id
                """
            ),
            {"pid": post_id, "uid": user_id, "reason": reason, "details": details},
        )
    ).mappings().first()
    await session.commit()
    return {"id": str(row["id"]), "reported": True}


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
