"""Platform Background Jobs — enqueue e processamento (WF-013)."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

JOB_FULFILLMENT_CREATE = "fulfillment.create"
JOB_FULFILLMENT_SYNC_ORDER = "fulfillment.sync_order"
JOB_FULFILLMENT_GENERATE_LABEL = "fulfillment.generate_label"
JOB_FULFILLMENT_TRACKING_SYNC = "fulfillment.tracking_sync"
JOB_FULFILLMENT_CARRIER_WEBHOOK = "fulfillment.carrier_webhook"
JOB_OUTBOX_PUBLISH = "platform.publish_outbox"
JOB_PAYMENT_RECONCILE = "payment.reconcile"
JOB_SETTLEMENT_BATCH = "settlement.batch"
JOB_CHARGE_BACK_PROCESS = "chargeback.process"


async def enqueue_job(
    session: AsyncSession,
    *,
    job_type: str,
    payload: dict[str, Any],
    correlation_id: str | None = None,
    priority: int = 0,
    run_after: datetime | None = None,
    max_attempts: int = 5,
) -> str:
    """Persiste job para execução assíncrona — nunca executa lógica pesada aqui."""
    cid = correlation_id or str(uuid.uuid4())
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.platform_jobs
                  (job_type, payload, correlation_id, priority, run_after, max_attempts)
                VALUES (:jt, CAST(:payload AS jsonb), CAST(:cid AS uuid), :pri, :run_after, :max)
                RETURNING id
                """
            ),
            {
                "jt": job_type,
                "payload": json.dumps(payload),
                "cid": cid,
                "pri": priority,
                "run_after": run_after or datetime.now(UTC),
                "max": max_attempts,
            },
        )
    ).mappings().first()
    return str(row["id"])


async def emit_outbox_event(
    session: AsyncSession,
    *,
    event_type: str,
    aggregate_type: str,
    aggregate_id: str,
    payload: dict[str, Any],
    correlation_id: str,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.domain_event_outbox
              (event_type, aggregate_type, aggregate_id, payload, correlation_id)
            VALUES (:et, :at, CAST(:aid AS uuid), CAST(:payload AS jsonb), CAST(:cid AS uuid))
            """
        ),
        {
            "et": event_type,
            "at": aggregate_type,
            "aid": aggregate_id,
            "payload": json.dumps(payload),
            "cid": correlation_id,
        },
    )
    await enqueue_job(
        session,
        job_type=JOB_OUTBOX_PUBLISH,
        payload={"limit": 50},
        correlation_id=correlation_id,
        priority=-1,
    )


async def _claim_pending_jobs(session: AsyncSession, limit: int = 10) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.platform_jobs
                SET status = 'running', started_at = NOW(), attempts = attempts + 1, updated_at = NOW()
                WHERE id IN (
                  SELECT id FROM tcg_judge.platform_jobs
                  WHERE status = 'pending' AND run_after <= NOW()
                  ORDER BY priority DESC, created_at ASC
                  LIMIT :lim
                  FOR UPDATE SKIP LOCKED
                )
                RETURNING *
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def _complete_job(session: AsyncSession, job_id: str) -> None:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.platform_jobs
            SET status = 'completed', completed_at = NOW(), updated_at = NOW()
            WHERE id = CAST(:id AS uuid)
            """
        ),
        {"id": job_id},
    )


async def _fail_job(
    session: AsyncSession,
    job_id: str,
    *,
    error: str,
    attempts: int,
    max_attempts: int,
) -> None:
    if attempts >= max_attempts:
        status = "dead_letter"
        run_after = None
    else:
        status = "pending"
        backoff_min = min(60, 2 ** attempts)
        run_after = datetime.now(UTC) + timedelta(minutes=backoff_min)

    await session.execute(
        text(
            """
            UPDATE tcg_judge.platform_jobs
            SET status = :status,
                last_error = :err,
                run_after = COALESCE(:run_after, run_after),
                updated_at = NOW()
            WHERE id = CAST(:id AS uuid)
            """
        ),
        {"id": job_id, "status": status, "err": error[:2000], "run_after": run_after},
    )


async def process_pending_jobs(session: AsyncSession, *, limit: int = 10) -> dict[str, Any]:
    """Worker entrypoint — processa fila de jobs pendentes."""
    from app.platform import job_handlers

    jobs = await _claim_pending_jobs(session, limit=limit)
    processed = 0
    failed = 0

    for job in jobs:
        job_id = str(job["id"])
        job_type = str(job["job_type"])
        payload = job.get("payload") or {}
        if isinstance(payload, str):
            payload = json.loads(payload)

        try:
            await job_handlers.dispatch(session, job_type, payload, job)
            await _complete_job(session, job_id)
            processed += 1
        except Exception as exc:
            logger.exception("platform_job_failed", job_id=job_id, job_type=job_type)
            await _fail_job(
                session,
                job_id,
                error=str(exc),
                attempts=int(job["attempts"]),
                max_attempts=int(job["max_attempts"]),
            )
            failed += 1

    await session.commit()
    return {"processed": processed, "failed": failed, "claimed": len(jobs)}
