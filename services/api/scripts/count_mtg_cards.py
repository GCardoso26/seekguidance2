from __future__ import annotations

import asyncio

from app.infrastructure.db.session import get_session_factory
from sqlalchemy import text


async def main() -> None:
    async with get_session_factory()() as session:
        mtg = (
            await session.execute(
                text("SELECT count(*) FROM tcg_judge.card_catalog WHERE game_code = 'MTG'")
            )
        ).scalar()
        last = (
            await session.execute(
                text(
                    """
                    SELECT status, cards_synced, finished_at
                    FROM tcg_judge.card_sync_runs
                    WHERE game_code = 'MTG'
                    ORDER BY started_at DESC
                    LIMIT 1
                    """
                )
            )
        ).mappings().first()
        print("MTG cards:", mtg)
        print("Last sync run:", dict(last) if last else None)


if __name__ == "__main__":
    asyncio.run(main())
