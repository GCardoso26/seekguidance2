"""Enqueue analytics jobs from domain events."""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.platform.jobs import (
    JOB_ANALYTICS_REBUILD,
    JOB_CHURN_SCORE,
    JOB_PRICING_SUGGEST,
    enqueue_job,
)

logger = structlog.get_logger(__name__)


async def enqueue_analytics_rebuild(
    session: AsyncSession,
    *,
    store_id: str,
    event_type: str,
    source_id: str | None = None,
    correlation_id: str | None = None,
) -> None:
    cid = correlation_id or str(uuid.uuid4())
    await enqueue_job(
        session,
        job_type=JOB_ANALYTICS_REBUILD,
        payload={
            "store_id": store_id,
            "trigger_event": event_type,
            "source_id": source_id,
        },
        correlation_id=cid,
        priority=3,
    )


async def enqueue_pricing_suggest(
    session: AsyncSession,
    *,
    store_id: str,
    correlation_id: str | None = None,
) -> None:
    cid = correlation_id or str(uuid.uuid4())
    await enqueue_job(
        session,
        job_type=JOB_PRICING_SUGGEST,
        payload={"store_id": store_id},
        correlation_id=cid,
        priority=4,
    )


async def enqueue_churn_score(
    session: AsyncSession,
    *,
    store_id: str,
    correlation_id: str | None = None,
) -> None:
    cid = correlation_id or str(uuid.uuid4())
    await enqueue_job(
        session,
        job_type=JOB_CHURN_SCORE,
        payload={"store_id": store_id},
        correlation_id=cid,
        priority=4,
    )
