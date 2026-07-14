"""Worker de jobs agendados (ranking decay, etc.)."""

from __future__ import annotations

import asyncio
import logging

from app.config.validate import require_production_config
from app.core.config import get_settings
from app.jobs.ranking_decay import apply_ranking_decay_job
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def _run_decay() -> None:
    try:
        result = await apply_ranking_decay_job()
        logger.info("ranking_decay_done %s", result)
    except Exception:
        logger.exception("ranking_decay_failed")


async def _run_weekly_report() -> None:
    try:
        from app.jobs.weekly_report import run_weekly_report_job

        result = await run_weekly_report_job()
        logger.info("weekly_report_done %s", result)
    except Exception:
        logger.exception("weekly_report_failed")


def main() -> None:
    settings = get_settings()
    if settings.environment == "production":
        require_production_config(settings)

    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(_run_decay, "cron", hour=4, minute=0, id="ranking_decay")
    scheduler.add_job(_run_weekly_report, "cron", day_of_week="mon", hour=12, minute=0, id="weekly_report")
    scheduler.start()
    logger.info("worker_started", env=settings.environment, jobs=["ranking_decay@04:00UTC", "weekly_report@Mon12:00UTC"])

    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        scheduler.shutdown()


if __name__ == "__main__":
    main()
