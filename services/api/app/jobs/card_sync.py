"""Job de sync de cartas — invocável via CLI ou endpoint admin."""

from __future__ import annotations

import asyncio
import logging

from app.infrastructure.db.session import get_session_factory
from app.tcg_adapters.sync_lorcana import sync_lorcana
from app.tcg_adapters.sync_mtg import sync_scryfall
from app.tcg_adapters.sync_pokemon import sync_tcgdex

logger = logging.getLogger(__name__)

SYNCERS = {
    "MTG": lambda s: sync_scryfall(s, limit=500),
    "POKEMON": lambda s: sync_tcgdex(s, max_sets=2),
    "LORCANA": sync_lorcana,
}


async def run_card_sync(game: str | None = None) -> dict:
    results = {}
    games = [game.upper()] if game else list(SYNCERS.keys())
    async with get_session_factory()() as session:
        for g in games:
            fn = SYNCERS.get(g)
            if not fn:
                results[g] = {"status": "skipped"}
                continue
            try:
                results[g] = await fn(session)
                logger.info("card_sync_complete", game=g, result=results[g])
            except Exception as exc:
                results[g] = {"status": "error", "message": str(exc)}
                logger.exception("card_sync_failed", game=g)
    return results


def main() -> None:
    asyncio.run(run_card_sync())


if __name__ == "__main__":
    main()
