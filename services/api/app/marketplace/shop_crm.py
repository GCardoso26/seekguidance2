"""CRM básico — clientes da loja a partir de pedidos."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_store import store_plan_has_feature


def _segment_for(total_spent_cents: int, order_count: int) -> str:
    if order_count >= 5 or total_spent_cents >= 50000:
        return "high_spender"
    if order_count >= 2:
        return "frequent"
    if order_count == 1:
        return "new"
    return "inactive"


async def _assert_store_owner(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    return dict(row)


async def upsert_customer_from_order(
    session: AsyncSession,
    *,
    store_id: str,
    customer_id: str,
    amount_cents: int,
    email: str | None = None,
    display_name: str | None = None,
) -> None:
    if not customer_id:
        return
    now = datetime.now(UTC)
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.store_customers (
              store_id, customer_id, email, display_name,
              total_spent_cents, order_count, last_order_at, segment
            ) VALUES (
              :sid, :cid, :email, :name, :amt, 1, :now, 'new'
            )
            ON CONFLICT (store_id, customer_id) DO UPDATE SET
              email = COALESCE(EXCLUDED.email, store_customers.email),
              display_name = COALESCE(EXCLUDED.display_name, store_customers.display_name),
              total_spent_cents = store_customers.total_spent_cents + EXCLUDED.total_spent_cents,
              order_count = store_customers.order_count + 1,
              last_order_at = EXCLUDED.last_order_at,
              updated_at = NOW()
            """
        ),
        {
            "sid": store_id,
            "cid": customer_id,
            "email": email,
            "name": display_name,
            "amt": amount_cents,
            "now": now,
        },
    )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.store_customers
            SET segment = CASE
              WHEN order_count >= 5 OR total_spent_cents >= 50000 THEN 'high_spender'
              WHEN order_count >= 2 THEN 'frequent'
              WHEN order_count = 1 THEN 'new'
              ELSE 'inactive'
            END
            WHERE store_id = :sid AND customer_id = :cid
            """
        ),
        {"sid": store_id, "cid": customer_id},
    )


async def sync_customers_from_orders(session: AsyncSession, store_id: str, owner_id: str) -> int:
    store = await _assert_store_owner(session, store_id, owner_id)
    if not store_plan_has_feature(store, "crm"):
        raise HTTPException(403, "CRM disponível no plano Lojista ou superior")

    rows = (
        await session.execute(
            text(
                """
                SELECT o.buyer_id,
                       p.display_name,
                       COALESCE(SUM(o.total_cents), 0) AS spent,
                       COUNT(*) AS cnt,
                       MAX(o.created_at) AS last_at
                FROM tcg_judge.shop_orders o
                LEFT JOIN tcg_judge.player_profiles p ON p.id = o.buyer_id
                WHERE o.store_id = :sid AND o.status IN ('paid', 'shipped', 'delivered', 'completed')
                  AND o.buyer_id IS NOT NULL
                GROUP BY o.buyer_id, p.display_name
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    for row in rows:
        spent = int(row["spent"])
        cnt = int(row["cnt"])
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.store_customers (
                  store_id, customer_id, display_name,
                  total_spent_cents, order_count, last_order_at, segment
                ) VALUES (
                  :sid, :cid, :name, :spent, :cnt, :last, :seg
                )
                ON CONFLICT (store_id, customer_id) DO UPDATE SET
                  display_name = COALESCE(EXCLUDED.display_name, store_customers.display_name),
                  total_spent_cents = EXCLUDED.total_spent_cents,
                  order_count = EXCLUDED.order_count,
                  last_order_at = EXCLUDED.last_order_at,
                  segment = EXCLUDED.segment,
                  updated_at = NOW()
                """
            ),
            {
                "sid": store_id,
                "cid": row["buyer_id"],
                "name": row.get("display_name"),
                "spent": spent,
                "cnt": cnt,
                "last": row["last_at"],
                "seg": _segment_for(spent, cnt),
            },
        )

    await session.commit()
    return len(rows)


async def list_customers(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    segment: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    store = await _assert_store_owner(session, store_id, owner_id)
    if not store_plan_has_feature(store, "crm"):
        raise HTTPException(403, "CRM disponível no plano Lojista ou superior")

    clauses = ["store_id = :sid"]
    params: dict[str, Any] = {"sid": store_id, "lim": min(limit, 200)}
    if segment:
        clauses.append("segment = :seg")
        params["seg"] = segment

    rows = (
        await session.execute(
            text(
                f"""
                SELECT * FROM tcg_judge.store_customers
                WHERE {' AND '.join(clauses)}
                ORDER BY last_order_at DESC NULLS LAST
                LIMIT :lim
                """
            ),
            params,
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def update_customer_notes(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    customer_id: str,
    notes: str,
) -> dict[str, Any]:
    store = await _assert_store_owner(session, store_id, owner_id)
    if not store_plan_has_feature(store, "crm"):
        raise HTTPException(403, "CRM disponível no plano Lojista ou superior")

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_customers
                SET notes = :notes, updated_at = NOW()
                WHERE store_id = :sid AND customer_id = :cid
                RETURNING *
                """
            ),
            {"notes": notes, "sid": store_id, "cid": customer_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Cliente não encontrado")
    await session.commit()
    return dict(row)


async def crm_summary(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    store = await _assert_store_owner(session, store_id, owner_id)
    if not store_plan_has_feature(store, "crm"):
        raise HTTPException(403, "CRM disponível no plano Lojista ou superior")

    row = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) AS total_customers,
                  COALESCE(SUM(total_spent_cents), 0) AS lifetime_revenue_cents,
                  COUNT(*) FILTER (WHERE segment = 'high_spender') AS high_spenders,
                  COUNT(*) FILTER (WHERE segment = 'frequent') AS frequent,
                  COUNT(*) FILTER (WHERE segment = 'new') AS new_customers
                FROM tcg_judge.store_customers
                WHERE store_id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    return dict(row) if row else {}
