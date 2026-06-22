"""Job: verificar alertas de preço (cron a cada 15 min)."""

from __future__ import annotations

import asyncio
import logging

from app.alerts.price_alerts import check_price_alerts
from app.infrastructure.db.session import get_session_factory

logger = logging.getLogger(__name__)


async def run_price_alert_check() -> dict:
    async with get_session_factory()() as session:
        result = await check_price_alerts(session)
        logger.info("price_alert_check_complete", **result)
        return result


def main() -> None:
    asyncio.run(run_price_alert_check())


if __name__ == "__main__":
    main()
