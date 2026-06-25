"""Feed unificado de notificações (social + marketplace/torneio)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.social import notifications as social_notifications

SHOP_LINKS: dict[str, str] = {
    "shop:order_created": "/vendedor/painel/vendas/{order_id}",
    "shop:pix_paid": "/perfil/pedidos",
    "shop:order_shipped": "/perfil/pedidos",
    "shop:order_delivered": "/perfil/pedidos",
    "shop:pro_activated": "/vendedor/painel",
    "shop:review_received": "/vendedor/painel",
    "shop:review_edited": "/vendedor/painel",
    "price_alert:triggered": "/alerts",
}


def _player_link(event_type: str, data: dict[str, Any] | None) -> str | None:
    data = data or {}
    template = SHOP_LINKS.get(event_type)
    if not template:
        return None
    order_id = data.get("order_id")
    if order_id and "{order_id}" in template:
        return template.format(order_id=order_id)
    return template.split("{")[0].rstrip("/") or None


def _player_row(row: dict[str, Any]) -> dict[str, Any]:
    data = row.get("data") or {}
    if isinstance(data, str):
        data = {}
    return {
        "id": str(row["id"]),
        "source": "marketplace",
        "type": row["event_type"],
        "title": row["title"],
        "content": row.get("body"),
        "link": _player_link(str(row["event_type"]), data),
        "readAt": row["read_at"].isoformat() if row.get("read_at") else None,
        "createdAt": row["sent_at"].isoformat() if row.get("sent_at") else None,
    }


def _social_row(item: dict[str, Any]) -> dict[str, Any]:
    return {
        **item,
        "source": "social",
    }


async def list_feed(session: AsyncSession, user_id: str, *, limit: int = 30) -> list[dict[str, Any]]:
    social = await social_notifications.list_recent(session, user_id, limit=limit)
    player_rows = (
        await session.execute(
            text(
                """
                SELECT id, event_type, title, body, data, read, sent_at, read_at
                FROM tcg_judge.player_notifications
                WHERE player_id = :uid
                ORDER BY sent_at DESC
                LIMIT :lim
                """
            ),
            {"uid": user_id, "lim": limit},
        )
    ).mappings().all()

    merged = [_social_row(s) for s in social] + [_player_row(dict(r)) for r in player_rows]
    merged.sort(key=lambda n: n.get("createdAt") or "", reverse=True)
    return merged[:limit]


async def unread_count(session: AsyncSession, user_id: str) -> int:
    social_count = await social_notifications.unread_count(session, user_id)
    player_count = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM tcg_judge.player_notifications
                WHERE player_id = :uid AND read = false
                """
            ),
            {"uid": user_id},
        )
    ).scalar()
    return social_count + int(player_count or 0)


async def mark_read(session: AsyncSession, user_id: str, notification_id: str, *, source: str) -> dict[str, bool]:
    if source == "marketplace":
        await session.execute(
            text(
                """
                UPDATE tcg_judge.player_notifications
                SET read = true, read_at = NOW()
                WHERE id = :nid AND player_id = :uid
                """
            ),
            {"nid": notification_id, "uid": user_id},
        )
        await session.commit()
        return {"read": True}

    return await social_notifications.mark_read(session, user_id, notification_id)


async def mark_all_read(session: AsyncSession, user_id: str) -> dict[str, int]:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.notifications SET read_at = NOW()
            WHERE user_id = :uid AND read_at IS NULL
            """
        ),
        {"uid": user_id},
    )
    player_result = await session.execute(
        text(
            """
            UPDATE tcg_judge.player_notifications
            SET read = true, read_at = NOW()
            WHERE player_id = :uid AND read = false
            """
        ),
        {"uid": user_id},
    )
    await session.commit()
    return {"marked": int(player_result.rowcount or 0)}
