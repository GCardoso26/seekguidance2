"""API interna da plataforma — workers e jobs."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.platform.jobs import process_pending_jobs
from fastapi import APIRouter, Header, HTTPException

router = APIRouter(tags=["platform"])


@router.post("/runtime/judge/platform/jobs/process")
async def platform_jobs_process(
    session: DbSession,
    limit: int = 10,
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
) -> dict[str, Any]:
    """Processa jobs pendentes — invocado por cron/worker, nunca pelo painel."""
    import os

    expected = os.environ.get("CRON_SECRET") or os.environ.get("PLATFORM_CRON_SECRET")
    if expected and x_cron_secret != expected:
        raise HTTPException(403, "Forbidden")

    return await process_pending_jobs(session, limit=min(50, max(1, limit)))
