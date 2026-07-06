"""Settlement batch service — aggregate Settlement."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.payments.ledger import post_settlement_release_entries
from app.platform.jobs import emit_outbox_event

logger = structlog.get_logger(__name__)

_SETTLEMENT_TRANSITIONS: dict[str, set[str]] = {
    "Pending": {"Processing", "Blocked"},
    "Processing": {"Released", "Failed", "Blocked"},
    "Released": {"Reconciled"},
    "Blocked": {"Pending", "Processing"},
    "Reconciled": set(),
    "Failed": {"Pending"},
}


async def create_settlement_batch(
    session: AsyncSession,
    *,
    store_id: str,
    correlation_id: str | None = None,
    max_items: int = 100,
) -> dict[str, Any] | None:
    """Agrupa pagamentos Approved sem settlement em um lote."""
    cid = correlation_id or str(uuid.uuid4())
    batch_key = f"settlement-{store_id}-{datetime.now(UTC).strftime('%Y%m%d%H')}"

    existing = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.settlements
                WHERE batch_key = :bk AND status IN ('Pending', 'Processing')
                """
            ),
            {"bk": batch_key},
        )
    ).mappings().first()
    if existing:
        return {"settlement_id": str(existing["id"]), "status": "existing"}

    candidates = (
        await session.execute(
            text(
                """
                SELECT p.id, p.shop_order_id, p.store_amount_cents, p.stripe_transfer_id
                FROM tcg_judge.payments p
                WHERE p.store_id = CAST(:sid AS uuid)
                  AND p.status = 'Approved'
                  AND p.use_escrow = false
                  AND NOT EXISTS (
                    SELECT 1 FROM tcg_judge.settlement_items si WHERE si.payment_id = p.id
                  )
                  AND NOT EXISTS (
                    SELECT 1 FROM tcg_judge.chargebacks cb
                    WHERE cb.payment_id = p.id AND cb.status IN ('opened', 'under_review')
                  )
                ORDER BY p.approved_at ASC NULLS LAST
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": max_items},
        )
    ).mappings().all()

    if not candidates:
        return None

    total = sum(int(r["store_amount_cents"] or 0) for r in candidates)
    if total <= 0:
        return None

    settlement = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.settlements
                  (store_id, status, total_cents, item_count, batch_key, correlation_id)
                VALUES (
                  CAST(:sid AS uuid), 'Pending', :total, :cnt, :bk, CAST(:cid AS uuid)
                )
                RETURNING id
                """
            ),
            {
                "sid": store_id,
                "total": total,
                "cnt": len(candidates),
                "bk": batch_key,
                "cid": cid,
            },
        )
    ).mappings().first()
    settlement_id = str(settlement["id"])

    for row in candidates:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.settlement_items
                  (settlement_id, payment_id, shop_order_id, amount_cents, stripe_transfer_id)
                VALUES (
                  CAST(:set_id AS uuid), CAST(:pid AS uuid), CAST(:oid AS uuid),
                  :amt, :xfer
                )
                """
            ),
            {
                "set_id": settlement_id,
                "pid": str(row["id"]),
                "oid": str(row["shop_order_id"]),
                "amt": int(row["store_amount_cents"] or 0),
                "xfer": row.get("stripe_transfer_id"),
            },
        )

    logger.info(
        "settlement_batch_created",
        settlement_id=settlement_id,
        store_id=store_id,
        item_count=len(candidates),
        total_cents=total,
    )
    return {"settlement_id": settlement_id, "item_count": len(candidates), "total_cents": total}


async def process_settlement_batch(
    session: AsyncSession,
    *,
    settlement_id: str,
    correlation_id: str | None = None,
) -> dict[str, Any]:
    """Pending → Processing → Released (sem Stripe transfer inline — marca ledger)."""
    cid = correlation_id or str(uuid.uuid4())
    row = (
        await session.execute(
            text(
                """
                SELECT id, store_id, status, total_cents, item_count
                FROM tcg_judge.settlements WHERE id = CAST(:sid AS uuid)
                """
            ),
            {"sid": settlement_id},
        )
    ).mappings().first()
    if not row:
        return {"status": "not_found"}

    current = str(row["status"])
    if current == "Pending":
        await session.execute(
            text(
                """
                UPDATE tcg_judge.settlements
                SET status = 'Processing', updated_at = NOW()
                WHERE id = CAST(:sid AS uuid) AND status = 'Pending'
                """
            ),
            {"sid": settlement_id},
        )
        current = "Processing"

    if current == "Processing":
        total = int(row["total_cents"])
        await post_settlement_release_entries(
            session,
            settlement_id=settlement_id,
            amount_cents=total,
            correlation_id=cid,
        )
        await session.execute(
            text(
                """
                UPDATE tcg_judge.settlements
                SET status = 'Released', released_at = NOW(), updated_at = NOW()
                WHERE id = CAST(:sid AS uuid) AND status = 'Processing'
                """
            ),
            {"sid": settlement_id},
        )
        await emit_outbox_event(
            session,
            event_type="SettlementReleased",
            aggregate_type="Settlement",
            aggregate_id=settlement_id,
            payload={"store_id": str(row["store_id"]), "total_cents": total},
            correlation_id=cid,
        )
        return {"status": "Released", "settlement_id": settlement_id}

    return {"status": current, "settlement_id": settlement_id}


async def reconcile_settlement(
    session: AsyncSession,
    *,
    settlement_id: str,
    correlation_id: str | None = None,
) -> dict[str, Any]:
    cid = correlation_id or str(uuid.uuid4())
    row = (
        await session.execute(
            text("SELECT status FROM tcg_judge.settlements WHERE id = CAST(:sid AS uuid)"),
            {"sid": settlement_id},
        )
    ).mappings().first()
    if not row:
        return {"status": "not_found"}
    if str(row["status"]) != "Released":
        return {"status": str(row["status"]), "skipped": True}

    await session.execute(
        text(
            """
            UPDATE tcg_judge.settlements
            SET status = 'Reconciled', reconciled_at = NOW(), updated_at = NOW()
            WHERE id = CAST(:sid AS uuid) AND status = 'Released'
            """
        ),
        {"sid": settlement_id},
    )
    await emit_outbox_event(
        session,
        event_type="SettlementReconciled",
        aggregate_type="Settlement",
        aggregate_id=settlement_id,
        payload={},
        correlation_id=cid,
    )
    return {"status": "Reconciled", "settlement_id": settlement_id}


async def run_settlement_batch_for_all_stores(
    session: AsyncSession,
    *,
    correlation_id: str | None = None,
    max_stores: int = 50,
) -> dict[str, Any]:
    """Cron: cria e processa lotes por loja com pagamentos elegíveis."""
    cid = correlation_id or str(uuid.uuid4())
    stores = (
        await session.execute(
            text(
                """
                SELECT DISTINCT p.store_id
                FROM tcg_judge.payments p
                WHERE p.status = 'Approved'
                  AND p.use_escrow = false
                  AND NOT EXISTS (
                    SELECT 1 FROM tcg_judge.settlement_items si WHERE si.payment_id = p.id
                  )
                LIMIT :lim
                """
            ),
            {"lim": max_stores},
        )
    ).mappings().all()

    created = 0
    released = 0
    for store_row in stores:
        store_id = str(store_row["store_id"])
        batch = await create_settlement_batch(session, store_id=store_id, correlation_id=cid)
        if not batch or batch.get("status") == "existing":
            continue
        created += 1
        result = await process_settlement_batch(
            session, settlement_id=batch["settlement_id"], correlation_id=cid
        )
        if result.get("status") == "Released":
            released += 1
            await reconcile_settlement(session, settlement_id=batch["settlement_id"], correlation_id=cid)

    return {"batches_created": created, "batches_released": released, "stores_scanned": len(stores)}
