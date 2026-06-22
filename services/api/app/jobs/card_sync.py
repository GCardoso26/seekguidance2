"""Job de sync de cartas — Fase 0 pipeline."""

from __future__ import annotations

import asyncio
import logging

from app.catalog.pipeline import run_full_ingestion, run_game_sync
from app.infrastructure.db.session import get_session_factory

logger = logging.getLogger(__name__)


async def run_card_sync(game: str | None = None, *, full: bool = False) -> dict:
    async with get_session_factory()() as session:
        if game:
            result = await run_game_sync(session, game, full=full)
            logger.info("card_sync_complete", game=game, result=result)
            return {game.upper(): result}
        results = await run_full_ingestion(session, full=full)
        logger.info("card_sync_full_complete", games=list(results.keys()))
        return results


def main() -> None:
    asyncio.run(run_card_sync())


if __name__ == "__main__":
    main()
