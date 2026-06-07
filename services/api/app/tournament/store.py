"""Persistência de torneio (Postgres via SQL async)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.tournament.engine.swiss import recommended_swiss_rounds
from app.tournament.types import PairingRecord, Participant
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def ensure_judge_profile(session: AsyncSession, user_id: str, display_name: str | None = None) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.judge_profiles (id, display_name, role)
            VALUES (:id, :name, 'player')
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {"id": user_id, "name": display_name or user_id},
    )


async def get_tournament(session: AsyncSession, tournament_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.tournaments WHERE id = :id"),
            {"id": tournament_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def update_tournament_status(
    session: AsyncSession,
    tournament_id: str,
    *,
    status: str,
    phase: str | None = None,
    current_round: int | None = None,
    total_swiss_rounds: int | None = None,
) -> None:
    sets = ["status = :status", "updated_at = NOW()"]
    params: dict[str, Any] = {"id": tournament_id, "status": status}
    if phase is not None:
        sets.append("phase = :phase")
        params["phase"] = phase
    if current_round is not None:
        sets.append("current_round = :current_round")
        params["current_round"] = current_round
    if total_swiss_rounds is not None:
        sets.append("total_swiss_rounds = :total_swiss_rounds")
        params["total_swiss_rounds"] = total_swiss_rounds
    await session.execute(
        text(f"UPDATE tcg_judge.tournaments SET {', '.join(sets)} WHERE id = :id"),
        params,
    )


async def list_participants(session: AsyncSession, tournament_id: str) -> list[Participant]:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.tournament_participants
                WHERE tournament_id = :tid
                ORDER BY match_points DESC, omw_percent DESC
                """
            ),
            {"tid": tournament_id},
        )
    ).mappings().all()
    return [_row_to_participant(dict(r)) for r in rows]


def _row_to_participant(row: dict[str, Any]) -> Participant:
    return Participant(
        id=str(row["id"]),
        user_id=row["user_id"],
        display_name=row.get("display_name") or row["user_id"],
        status=row["status"],
        match_points=row["match_points"],
        match_wins=row["match_wins"],
        match_losses=row["match_losses"],
        match_draws=row["match_draws"],
        game_wins=row["game_wins"],
        game_losses=row["game_losses"],
        game_draws=row["game_draws"],
        omw_percent=float(row["omw_percent"]),
        gw_percent=float(row["gw_percent"]),
        ogw_percent=float(row["ogw_percent"]),
        had_bye=bool(row.get("had_bye")),
    )


async def register_participant(
    session: AsyncSession,
    tournament_id: str,
    user_id: str,
    display_name: str | None = None,
) -> Participant:
    await ensure_judge_profile(session, user_id, display_name)
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.tournament_participants
                  (tournament_id, user_id, display_name, status)
                VALUES (:tid, :uid, :name, 'registered')
                ON CONFLICT (tournament_id, user_id) DO UPDATE
                  SET display_name = COALESCE(EXCLUDED.display_name, tournament_participants.display_name)
                RETURNING *
                """
            ),
            {"tid": tournament_id, "uid": user_id, "name": display_name},
        )
    ).mappings().first()
    return _row_to_participant(dict(row))


async def check_in_participant(
    session: AsyncSession,
    tournament_id: str,
    user_id: str,
) -> Participant | None:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.tournament_participants
                SET status = 'checked_in', checked_in_at = NOW()
                WHERE tournament_id = :tid AND user_id = :uid AND status IN ('registered', 'checked_in')
                RETURNING *
                """
            ),
            {"tid": tournament_id, "uid": user_id},
        )
    ).mappings().first()
    return _row_to_participant(dict(row)) if row else None


async def check_in_all_registered(session: AsyncSession, tournament_id: str) -> int:
    result = await session.execute(
        text(
            """
            UPDATE tcg_judge.tournament_participants
            SET status = 'checked_in', checked_in_at = NOW()
            WHERE tournament_id = :tid AND status = 'registered'
            """
        ),
        {"tid": tournament_id},
    )
    return result.rowcount or 0


async def drop_participant(session: AsyncSession, tournament_id: str, user_id: str) -> None:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.tournament_participants
            SET status = 'dropped', dropped_at = NOW()
            WHERE tournament_id = :tid AND user_id = :uid
            """
        ),
        {"tid": tournament_id, "uid": user_id},
    )


async def save_participant_stats(session: AsyncSession, p: Participant) -> None:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.tournament_participants SET
              match_points = :mp, match_wins = :mw, match_losses = :ml, match_draws = :md,
              game_wins = :gw, game_losses = :gl, game_draws = :gd,
              omw_percent = :omw, gw_percent = :gwp, ogw_percent = :ogw,
              had_bye = :had_bye, status = 'active'
            WHERE id = :id
            """
        ),
        {
            "id": p.id,
            "mp": p.match_points,
            "mw": p.match_wins,
            "ml": p.match_losses,
            "md": p.match_draws,
            "gw": p.game_wins,
            "gl": p.game_losses,
            "gd": p.game_draws,
            "omw": p.omw_percent,
            "gwp": p.gw_percent,
            "ogw": p.ogw_percent,
            "had_bye": p.had_bye,
        },
    )


async def create_round(
    session: AsyncSession,
    tournament_id: str,
    round_number: int,
    timer_duration_seconds: int,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.tournament_rounds
                  (tournament_id, round_number, status, timer_duration_seconds)
                VALUES (:tid, :rn, 'pending', :dur)
                RETURNING *
                """
            ),
            {"tid": tournament_id, "rn": round_number, "dur": timer_duration_seconds},
        )
    ).mappings().first()
    return dict(row)


async def get_round(session: AsyncSession, tournament_id: str, round_number: int) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.tournament_rounds
                WHERE tournament_id = :tid AND round_number = :rn
                """
            ),
            {"tid": tournament_id, "rn": round_number},
        )
    ).mappings().first()
    return dict(row) if row else None


async def get_round_by_id(session: AsyncSession, round_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.tournament_rounds WHERE id = :id"),
            {"id": round_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def activate_round(session: AsyncSession, round_id: str) -> None:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.tournament_rounds
            SET status = 'active', started_at = NOW(), timer_status = 'running'
            WHERE id = :id
            """
        ),
        {"id": round_id},
    )


async def complete_round(session: AsyncSession, round_id: str) -> None:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.tournament_rounds
            SET status = 'completed', ended_at = NOW(), timer_status = 'ended'
            WHERE id = :id
            """
        ),
        {"id": round_id},
    )


async def insert_pairings(
    session: AsyncSession,
    tournament_id: str,
    round_id: str,
    pairings: list[Any],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for gp in pairings:
        row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.pairings (
                      round_id, tournament_id, table_number,
                      player1_id, player2_id, is_bye, is_forced_rematch
                    ) VALUES (
                      :rid, :tid, :table, :p1, :p2, :bye, :forced
                    )
                    RETURNING *
                    """
                ),
                {
                    "rid": round_id,
                    "tid": tournament_id,
                    "table": gp.table_number,
                    "p1": gp.player1_id,
                    "p2": gp.player2_id,
                    "bye": gp.is_bye,
                    "forced": gp.is_forced_rematch,
                },
            )
        ).mappings().first()
        rows.append(dict(row))
    return rows


async def list_pairings_for_tournament(session: AsyncSession, tournament_id: str) -> list[PairingRecord]:
    rows = (
        await session.execute(
            text(
                """
                SELECT p.*, r.round_number
                FROM tcg_judge.pairings p
                JOIN tcg_judge.tournament_rounds r ON r.id = p.round_id
                WHERE p.tournament_id = :tid
                ORDER BY r.round_number, p.table_number
                """
            ),
            {"tid": tournament_id},
        )
    ).mappings().all()
    return [_row_to_pairing(dict(r)) for r in rows]


async def list_pairings_for_round(session: AsyncSession, round_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT p.*,
                  p1.display_name AS player1_name, p1.match_points AS player1_points,
                  p2.display_name AS player2_name, p2.match_points AS player2_points
                FROM tcg_judge.pairings p
                JOIN tcg_judge.tournament_participants p1 ON p1.id = p.player1_id
                LEFT JOIN tcg_judge.tournament_participants p2 ON p2.id = p.player2_id
                WHERE p.round_id = :rid
                ORDER BY p.table_number
                """
            ),
            {"rid": round_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


def _row_to_pairing(row: dict[str, Any]) -> PairingRecord:
    return PairingRecord(
        id=str(row["id"]),
        round_number=row["round_number"],
        table_number=row["table_number"],
        player1_id=str(row["player1_id"]),
        player2_id=str(row["player2_id"]) if row.get("player2_id") else None,
        player1_wins=row.get("player1_wins", 0),
        player2_wins=row.get("player2_wins", 0),
        draws=row.get("draws", 0),
        status=row.get("status", "pending"),
        is_bye=bool(row.get("is_bye")),
        is_forced_rematch=bool(row.get("is_forced_rematch")),
    )


async def get_pairing(session: AsyncSession, pairing_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.pairings WHERE id = :id"),
            {"id": pairing_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def report_pairing_result(
    session: AsyncSession,
    pairing_id: str,
    reporter_participant_id: str,
    *,
    player1_wins: int,
    player2_wins: int,
    draws: int = 0,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.pairings SET
                  player1_wins = :p1w, player2_wins = :p2w, draws = :d,
                  status = 'reported', reported_by = :rep, updated_at = NOW()
                WHERE id = :id AND status IN ('pending', 'reported')
                RETURNING *
                """
            ),
            {
                "id": pairing_id,
                "p1w": player1_wins,
                "p2w": player2_wins,
                "d": draws,
                "rep": reporter_participant_id,
            },
        )
    ).mappings().first()
    return dict(row) if row else {}


async def confirm_pairing_result(
    session: AsyncSession,
    pairing_id: str,
    confirmer_participant_id: str,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.pairings SET
                  status = 'confirmed', confirmed_by = :conf, updated_at = NOW()
                WHERE id = :id AND status = 'reported'
                RETURNING *
                """
            ),
            {"id": pairing_id, "conf": confirmer_participant_id},
        )
    ).mappings().first()
    return dict(row) if row else {}


async def dispute_pairing_result(session: AsyncSession, pairing_id: str) -> None:
    await session.execute(
        text("UPDATE tcg_judge.pairings SET status = 'disputed', updated_at = NOW() WHERE id = :id"),
        {"id": pairing_id},
    )


async def resolve_swiss_rounds(tournament: dict[str, Any], active_count: int) -> int:
    swiss = tournament.get("swiss_rounds") or tournament.get("total_swiss_rounds")
    if swiss and str(swiss) != "auto":
        try:
            return int(swiss)
        except ValueError:
            pass
    return recommended_swiss_rounds(active_count)


async def save_bracket(session: AsyncSession, bracket_state: Any) -> str:
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.brackets (id, tournament_id, top_cut, status)
                VALUES (:id, :tid, :top, 'active')
                RETURNING id
                """
            ),
            {
                "id": bracket_state.id,
                "tid": bracket_state.tournament_id,
                "top": bracket_state.top_cut,
            },
        )
    ).mappings().first()
    for m in bracket_state.matches:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.bracket_matches (
                  id, bracket_id, round_number, match_number,
                  player1_id, player2_id, next_match_id, table_number, status
                ) VALUES (
                  :id, :bid, :rn, :mn, :p1, :p2, :next, :table, 'pending'
                )
                """
            ),
            {
                "id": m.id,
                "bid": bracket_state.id,
                "rn": m.round_number,
                "mn": m.match_number,
                "p1": m.player1_id,
                "p2": m.player2_id,
                "next": m.next_match_id,
                "table": m.table_number,
            },
        )
    return str(row["id"]) if row else bracket_state.id
