"""Job diário de decay de ranking (5% para inativos 30+ dias)."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta

from app.infrastructure.db.session import get_session_factory
from app.players.rankings import apply_decay, tier_from_points
from sqlalchemy import text

logger = logging.getLogger(__name__)


async def apply_ranking_decay_job() -> dict:
    cutoff = datetime.now(UTC) - timedelta(days=30)
    updated = 0

    async with get_session_factory()() as session:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT r.player_id, r.game_code, r.format, r.points
                    FROM tcg_judge.player_rankings r
                    WHERE NOT EXISTS (
                      SELECT 1 FROM tcg_judge.tournament_results tr
                      WHERE tr.player_id = r.player_id
                        AND tr.game_code = r.game_code
                        AND tr.created_at > :cutoff
                    )
                    AND (r.last_tournament_at IS NULL OR r.last_tournament_at < :cutoff)
                    """
                ),
                {"cutoff": cutoff},
            )
        ).mappings().all()

        for row in rows:
            new_pts = apply_decay(int(row["points"]), 1)
            tier, division = tier_from_points(new_pts)
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.player_rankings
                    SET points = :pts, tier = :tier, division = :div, last_updated = NOW()
                    WHERE player_id = :pid AND game_code = :gc AND format = :fc
                    """
                ),
                {
                    "pts": new_pts,
                    "tier": tier,
                    "div": division,
                    "pid": row["player_id"],
                    "gc": row["game_code"],
                    "fc": row["format"],
                },
            )
            updated += 1

        await session.commit()

    logger.info("ranking_decay_complete", updated=updated)
    return {"updated": updated, "cutoff": cutoff.isoformat()}


def main() -> None:
    result = asyncio.run(apply_ranking_decay_job())
    print(result)


if __name__ == "__main__":
    main()
