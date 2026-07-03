"""Tickets de atendimento do painel vendedor."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_dashboard import resolve_owner_store

TICKET_STATUSES = frozenset({"open", "in_progress", "waiting_customer", "resolved", "closed"})
TICKET_CATEGORIES = frozenset({"payment", "shipping", "product", "refund", "other"})
TICKET_PRIORITIES = frozenset({"low", "medium", "high", "urgent"})


async def list_tickets(
    session: AsyncSession,
    owner_id: str,
    *,
    status: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 25,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    clauses = ["t.store_id = :sid"]
    params: dict[str, Any] = {
        "sid": store_id,
        "lim": min(100, max(1, limit)),
        "off": (max(1, page) - 1) * limit,
    }
    if status:
        clauses.append("t.status = :status")
        params["status"] = status
    if category:
        clauses.append("t.category = :cat")
        params["cat"] = category
    if priority:
        clauses.append("t.priority = :pri")
        params["pri"] = priority
    if search:
        term = search.strip()
        if term:
            params["pat"] = f"%{term}%"
            clauses.append(
                "(t.subject ILIKE :pat OR t.id::text ILIKE :pat OR COALESCE(pp.display_name, '') ILIKE :pat)"
            )

    where = " AND ".join(clauses)
    rows = (
        await session.execute(
            text(
                f"""
                SELECT t.*,
                       pp.display_name AS customer_name,
                       o.id AS order_ref
                FROM tcg_judge.support_tickets t
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = t.customer_id
                LEFT JOIN tcg_judge.shop_orders o ON o.id = t.order_id
                WHERE {where}
                ORDER BY t.updated_at DESC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    count_row = (
        await session.execute(
            text(
                f"""
                SELECT COUNT(*) AS total
                FROM tcg_judge.support_tickets t
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = t.customer_id
                WHERE {where}
                """
            ),
            {k: v for k, v in params.items() if k not in {"lim", "off"}},
        )
    ).mappings().first()

    return {
        "tickets": [dict(r) for r in rows],
        "total": int(count_row["total"]) if count_row else 0,
        "page": page,
        "limit": limit,
    }


async def create_ticket(
    session: AsyncSession,
    owner_id: str,
    *,
    subject: str,
    category: str = "other",
    priority: str = "medium",
    customer_id: str | None = None,
    order_id: str | None = None,
    initial_message: str | None = None,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    if category not in TICKET_CATEGORIES:
        raise HTTPException(400, "Categoria inválida")
    if priority not in TICKET_PRIORITIES:
        raise HTTPException(400, "Prioridade inválida")

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.support_tickets (
                  store_id, order_id, customer_id, subject, category, priority, status, assigned_to
                ) VALUES (
                  :sid, :oid, :cid, :subj, :cat, :pri, 'open', :assignee
                )
                RETURNING *
                """
            ),
            {
                "sid": store_id,
                "oid": order_id,
                "cid": customer_id,
                "subj": subject.strip(),
                "cat": category,
                "pri": priority,
                "assignee": owner_id,
            },
        )
    ).mappings().first()

    ticket = dict(row) if row else {}
    ticket_id = str(ticket.get("id", ""))
    if ticket_id and initial_message:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.support_ticket_messages (
                  ticket_id, author_id, author_type, content, is_internal
                ) VALUES (:tid, :aid, 'staff', :content, false)
                """
            ),
            {"tid": ticket_id, "aid": owner_id, "content": initial_message.strip()},
        )

    await session.commit()
    return ticket


async def get_ticket(
    session: AsyncSession,
    owner_id: str,
    ticket_id: str,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    row = (
        await session.execute(
            text(
                """
                SELECT t.*,
                       pp.display_name AS customer_name,
                       pp.handle AS customer_handle
                FROM tcg_judge.support_tickets t
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = t.customer_id
                WHERE t.id = :id AND t.store_id = :sid
                """
            ),
            {"id": ticket_id, "sid": store_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Ticket não encontrado")

    messages = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.support_ticket_messages
                WHERE ticket_id = :tid
                ORDER BY created_at ASC
                """
            ),
            {"tid": ticket_id},
        )
    ).mappings().all()

    return {"ticket": dict(row), "messages": [dict(m) for m in messages]}


async def add_ticket_message(
    session: AsyncSession,
    owner_id: str,
    ticket_id: str,
    *,
    content: str,
    is_internal: bool = False,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    ticket = (
        await session.execute(
            text("SELECT id FROM tcg_judge.support_tickets WHERE id = :id AND store_id = :sid"),
            {"id": ticket_id, "sid": store_id},
        )
    ).mappings().first()
    if not ticket:
        raise HTTPException(404, "Ticket não encontrado")

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.support_ticket_messages (
                  ticket_id, author_id, author_type, content, is_internal
                ) VALUES (:tid, :aid, 'staff', :content, :internal)
                RETURNING *
                """
            ),
            {
                "tid": ticket_id,
                "aid": owner_id,
                "content": content.strip(),
                "internal": is_internal,
            },
        )
    ).mappings().first()

    await session.execute(
        text(
            """
            UPDATE tcg_judge.support_tickets
            SET updated_at = NOW(), status = CASE
              WHEN status = 'open' THEN 'in_progress'
              ELSE status
            END
            WHERE id = :id
            """
        ),
        {"id": ticket_id},
    )
    await session.commit()
    return dict(row) if row else {}


async def update_ticket_status(
    session: AsyncSession,
    owner_id: str,
    ticket_id: str,
    status: str,
) -> dict[str, Any]:
    if status not in TICKET_STATUSES:
        raise HTTPException(400, "Status inválido")
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    extra = ""
    if status == "resolved":
        extra = ", resolved_at = NOW()"
    elif status == "closed":
        extra = ", closed_at = NOW()"

    row = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.support_tickets
                SET status = :status, updated_at = NOW(){extra}
                WHERE id = :id AND store_id = :sid
                RETURNING *
                """
            ),
            {"status": status, "id": ticket_id, "sid": store_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Ticket não encontrado")
    await session.commit()
    return dict(row)


async def assign_ticket(
    session: AsyncSession,
    owner_id: str,
    ticket_id: str,
    assignee_id: str,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.support_tickets
                SET assigned_to = :assignee, updated_at = NOW(),
                    status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
                WHERE id = :id AND store_id = :sid
                RETURNING *
                """
            ),
            {"assignee": assignee_id, "id": ticket_id, "sid": store_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Ticket não encontrado")
    await session.commit()
    return dict(row)
