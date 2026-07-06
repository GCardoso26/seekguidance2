"""Handlers de Background Jobs da plataforma."""

from __future__ import annotations

from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


async def dispatch(
    session: AsyncSession,
    job_type: str,
    payload: dict[str, Any],
    job: dict[str, Any],
) -> None:
    handlers = {
        "fulfillment.create": _handle_fulfillment_create,
        "fulfillment.sync_order": _handle_fulfillment_sync_order,
        "fulfillment.generate_label": _handle_fulfillment_generate_label,
        "fulfillment.tracking_sync": _handle_fulfillment_tracking_sync,
        "fulfillment.carrier_webhook": _handle_carrier_webhook,
        "platform.publish_outbox": _handle_publish_outbox,
        "payment.reconcile": _handle_payment_reconcile,
        "settlement.batch": _handle_settlement_batch,
        "chargeback.process": _handle_chargeback_process,
        "reputation.recalculate": _handle_reputation_recalculate,
        "reputation.sla_check": _handle_reputation_sla_check,
        "analytics.rebuild": _handle_analytics_rebuild,
        "pricing.suggest": _handle_pricing_suggest,
        "churn.score": _handle_churn_score,
    }
    handler = handlers.get(job_type)
    if not handler:
        raise ValueError(f"Unknown job type: {job_type}")
    await handler(session, payload, job)


async def _handle_fulfillment_create(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.marketplace import seller_fulfillment

    order_id = str(payload["order_id"])
    await seller_fulfillment.create_fulfillment_for_order(session, order_id)


async def _handle_fulfillment_sync_order(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.marketplace import seller_fulfillment

    await seller_fulfillment.sync_shop_order_from_fulfillment(
        session,
        fulfillment_id=str(payload["fulfillment_id"]),
        actor_id=payload.get("actor_id"),
    )


async def _handle_fulfillment_generate_label(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.marketplace import seller_fulfillment

    await seller_fulfillment.generate_shipping_label(
        session,
        fulfillment_id=str(payload["fulfillment_id"]),
        carrier=payload.get("carrier"),
        correlation_id=str(job.get("correlation_id") or payload.get("correlation_id", "")),
    )


async def _handle_fulfillment_tracking_sync(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.marketplace import seller_fulfillment

    await seller_fulfillment.sync_tracking_status(
        session,
        shipment_id=str(payload["shipment_id"]),
        tracking_status=str(payload.get("tracking_status", "InTransit")),
    )


async def _handle_carrier_webhook(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.marketplace import seller_fulfillment

    await seller_fulfillment.process_carrier_webhook_event(
        session, str(payload["webhook_event_id"])
    )


async def _handle_payment_reconcile(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.payments.reconciliation import reconcile_single_payment

    payment_id = str(payload["payment_id"])
    await reconcile_single_payment(session, payment_id=payment_id)


async def _handle_settlement_batch(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.payments.settlement_service import run_settlement_batch_for_all_stores

    correlation_id = str(job.get("correlation_id") or payload.get("correlation_id", ""))
    await run_settlement_batch_for_all_stores(session, correlation_id=correlation_id or None)


async def _handle_chargeback_process(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.payments.chargeback_service import process_chargeback_job

    correlation_id = str(job.get("correlation_id") or payload.get("correlation_id", ""))
    await process_chargeback_job(
        session,
        payment_id=str(payload["payment_id"]),
        correlation_id=correlation_id or None,
    )


async def _handle_reputation_recalculate(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.reputation.reputation_engine import recalculate_store_reputation

    correlation_id = str(job.get("correlation_id") or payload.get("correlation_id", ""))
    await recalculate_store_reputation(
        session,
        store_id=str(payload["store_id"]),
        correlation_id=correlation_id or None,
        trigger_event=payload.get("trigger_event"),
    )


async def _handle_reputation_sla_check(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.reputation.reputation_engine import run_sla_check_all_stores

    correlation_id = str(job.get("correlation_id") or payload.get("correlation_id", ""))
    await run_sla_check_all_stores(session, correlation_id=correlation_id or None)


async def _handle_analytics_rebuild(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.analytics.event_bridge import enqueue_churn_score, enqueue_pricing_suggest
    from app.analytics.projections import rebuild_store_projections

    store_id = str(payload["store_id"])
    correlation_id = str(job.get("correlation_id") or payload.get("correlation_id", ""))
    await rebuild_store_projections(
        session,
        store_id=store_id,
        correlation_id=correlation_id or None,
        trigger_event=payload.get("trigger_event"),
    )
    await enqueue_pricing_suggest(session, store_id=store_id, correlation_id=correlation_id or None)
    await enqueue_churn_score(session, store_id=store_id, correlation_id=correlation_id or None)


async def _handle_pricing_suggest(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.analytics.pricing_intelligence import compute_pricing_suggestions

    await compute_pricing_suggestions(session, store_id=str(payload["store_id"]))


async def _handle_churn_score(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    from app.analytics.churn_scoring import compute_churn_scores

    await compute_churn_scores(session, store_id=str(payload["store_id"]))


async def _handle_publish_outbox(
    session: AsyncSession, payload: dict[str, Any], job: dict[str, Any]
) -> None:
    """Marca eventos outbox como publicados (Event Bus futuro)."""
    limit = int(payload.get("limit", 50))
    rows = (
        await session.execute(
            text(
                """
                SELECT id, event_type, aggregate_type, aggregate_id, payload, correlation_id
                FROM tcg_judge.domain_event_outbox
                WHERE published_at IS NULL
                ORDER BY created_at ASC
                LIMIT :lim
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()

    for row in rows:
        logger.info(
            "domain_event_published",
            event_type=row["event_type"],
            aggregate_id=str(row["aggregate_id"]),
            correlation_id=str(row["correlation_id"]),
        )
        await session.execute(
            text(
                """
                UPDATE tcg_judge.domain_event_outbox
                SET published_at = NOW()
                WHERE id = :id
                """
            ),
            {"id": row["id"]},
        )
