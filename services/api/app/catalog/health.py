"""Health check da ingestão de cartas."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

GAMES = ("MTG", "POKEMON", "LORCANA", "YGO", "SWU")


async def verify_ingestion(session: AsyncSession) -> dict[str, Any]:
    report: dict[str, Any] = {
        "total_cards": 0,
        "by_game": {},
        "missing_images": [],
        "missing_prices": [],
        "last_sync": {},
        "ready_for_marketplace": False,
    }

    for game in GAMES:
        count_row = (
            await session.execute(
                text("SELECT count(*) AS c FROM tcg_judge.card_catalog WHERE game_code = :g"),
                {"g": game},
            )
        ).mappings().first()
        count = int(count_row["c"]) if count_row else 0
        report["by_game"][game] = count
        report["total_cards"] += count

        no_img = (
            await session.execute(
                text(
                    """
                    SELECT count(*) AS c FROM tcg_judge.card_catalog
                    WHERE game_code = :g
                      AND (image_url IS NULL OR image_url = '')
                      AND (image_uris IS NULL OR image_uris = '{}'::jsonb)
                    """
                ),
                {"g": game},
            )
        ).mappings().first()
        if no_img and int(no_img["c"]) > 0:
            report["missing_images"].append({"game": game, "count": int(no_img["c"])})

        week_ago = datetime.now(UTC) - timedelta(days=7)
        no_price = (
            await session.execute(
                text(
                    """
                    SELECT count(*) AS c FROM tcg_judge.card_catalog cc
                    WHERE cc.game_code = :g
                      AND NOT EXISTS (
                        SELECT 1 FROM tcg_judge.card_prices cp
                        WHERE cp.card_id = cc.id AND cp.recorded_at >= :since
                      )
                    """
                ),
                {"g": game, "since": week_ago},
            )
        ).mappings().first()
        if no_price and int(no_price["c"]) > 0 and count > 0:
            report["missing_prices"].append({"game": game, "count": int(no_price["c"])})

        last = (
            await session.execute(
                text(
                    """
                    SELECT max(finished_at) AS t FROM tcg_judge.card_sync_runs
                    WHERE game_code = :g AND status = 'ok'
                    """
                ),
                {"g": game},
            )
        ).mappings().first()
        if last and last.get("t"):
            report["last_sync"][game] = last["t"].isoformat()

    has_catalog = report["total_cards"] > 50
    no_critical_gaps = len(report["missing_images"]) == 0 or report["total_cards"] > 0
    report["ready_for_marketplace"] = has_catalog and no_critical_gaps
    report["status"] = "ready_for_marketplace" if report["ready_for_marketplace"] else "loading"
    return report
