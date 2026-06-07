"""Atualização de fair play score após infrações."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

PENALTY_DECAY = {
    "warning": 0.10,
    "game_loss": 0.25,
    "match_loss": 0.50,
    "disqualification": 1.00,
}

COUNTER_COLUMN = {
    "warning": "total_warnings",
    "game_loss": "total_game_losses",
    "match_loss": "total_match_losses",
    "disqualification": "total_dqs",
}


async def update_fair_play_score(
    session: AsyncSession,
    player_id: str,
    game_code: str,
    *,
    penalty: str,
) -> None:
    decay = PENALTY_DECAY.get(penalty, 0.10)
    counter = COUNTER_COLUMN.get(penalty, "total_warnings")
    now = datetime.now(UTC)

    await session.execute(
        text(
            f"""
            INSERT INTO tcg_judge.fair_play_scores
              (player_id, game_code, score, total_infractions, {counter}, last_infraction_at)
            VALUES
              (:pid, :gc, GREATEST(0, 5.00 - :decay), 1, 1, :now)
            ON CONFLICT (player_id, game_code) DO UPDATE SET
              score = GREATEST(0, fair_play_scores.score - :decay),
              total_infractions = fair_play_scores.total_infractions + 1,
              {counter} = fair_play_scores.{counter} + 1,
              last_infraction_at = :now,
              updated_at = :now
            """
        ),
        {"pid": player_id, "gc": game_code.upper(), "decay": decay, "now": now},
    )
