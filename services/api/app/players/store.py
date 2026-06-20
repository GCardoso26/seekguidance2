"""Persistência de perfis, stats, rankings e histórico."""

from __future__ import annotations

import re
from datetime import date
from typing import Any

from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import ARRAY, VARCHAR
from sqlalchemy.ext.asyncio import AsyncSession

from app.players.achievements import codes_to_unlock
from app.players.rankings import calculate_tournament_points, tier_from_points

HANDLE_RE = re.compile(r"^[a-zA-Z0-9_]{3,30}$")


async def ensure_judge_profile(session: AsyncSession, user_id: str) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.judge_profiles (id, role)
            VALUES (:id, 'player')
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {"id": user_id},
    )


async def get_profile_by_id(session: AsyncSession, player_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.player_profiles WHERE id = :id"),
            {"id": player_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def ensure_player_profile(session: AsyncSession, user_id: str) -> None:
    """Garante player_profiles + judge_profiles para FKs de loja/carrinho/pedidos."""
    if await get_profile_by_id(session, user_id):
        return
    await ensure_judge_profile(session, user_id)
    handle = f"u{user_id.replace('-', '')[:28]}"
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.player_profiles (id, handle, display_name)
            VALUES (:id, :handle, :name)
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {"id": user_id, "handle": handle[:30], "name": "Jogador"},
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.notification_preferences (player_id)
            VALUES (:id) ON CONFLICT (player_id) DO NOTHING
            """
        ),
        {"id": user_id},
    )


async def get_profile_by_handle(session: AsyncSession, handle: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.player_profiles WHERE LOWER(handle) = LOWER(:h)"),
            {"h": handle},
        )
    ).mappings().first()
    return dict(row) if row else None


async def create_profile(
    session: AsyncSession,
    user_id: str,
    *,
    handle: str,
    display_name: str,
    bio: str | None = None,
    favorite_game: str | None = None,
    city: str | None = None,
    country: str | None = None,
) -> dict[str, Any]:
    if not HANDLE_RE.match(handle):
        raise ValueError("Handle inválido (3-30 chars, alfanumérico e _)")
    await ensure_judge_profile(session, user_id)
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.player_profiles
                  (id, handle, display_name, bio, favorite_game, city, country)
                VALUES (:id, :handle, :name, :bio, :fg, :city, :country)
                RETURNING *
                """
            ),
            {
                "id": user_id,
                "handle": handle.lower(),
                "name": display_name,
                "bio": bio,
                "fg": favorite_game,
                "city": city,
                "country": country or "BR",
            },
        )
    ).mappings().first()
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.notification_preferences (player_id)
            VALUES (:id) ON CONFLICT (player_id) DO NOTHING
            """
        ),
        {"id": user_id},
    )
    return dict(row)


async def update_profile(session: AsyncSession, user_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    allowed = {
        "display_name",
        "bio",
        "avatar_url",
        "favorite_game",
        "city",
        "country",
        "timezone",
        "privacy_level",
        "birth_date",
        "state",
        "favorite_tcgs",
        "has_completed_onboarding",
    }
    sets: list[str] = []
    params: dict[str, Any] = {"id": user_id}
    uses_tcgs_array = False

    for k, v in fields.items():
        if k not in allowed or v is None:
            continue
        if k == "favorite_tcgs":
            sets.append("favorite_tcgs = :favorite_tcgs")
            params["favorite_tcgs"] = [str(x) for x in v] if isinstance(v, list | tuple) else [str(v)]
            uses_tcgs_array = True
        elif k == "birth_date":
            sets.append("birth_date = :birth_date")
            params["birth_date"] = date.fromisoformat(str(v)[:10])
        else:
            sets.append(f"{k} = :{k}")
            params[k] = v

    if not sets:
        prof = await get_profile_by_id(session, user_id)
        return prof or {}

    stmt = text(
        f"UPDATE tcg_judge.player_profiles SET {', '.join(sets)}, "
        "updated_at = NOW() WHERE id = :id RETURNING *"
    )
    if uses_tcgs_array:
        stmt = stmt.bindparams(bindparam("favorite_tcgs", type_=ARRAY(VARCHAR)))

    row = (await session.execute(stmt, params)).mappings().first()
    if row:
        return dict(row)

    existing = await get_profile_by_id(session, user_id)
    if not existing:
        raise ValueError("Perfil não encontrado")
    return existing


async def get_game_stats(session: AsyncSession, player_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text("SELECT * FROM tcg_judge.player_game_stats WHERE player_id = :id ORDER BY game_code"),
            {"id": player_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def get_rankings(session: AsyncSession, player_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT game_code, format, points, tier, division, matches_played, last_updated
                FROM tcg_judge.player_rankings WHERE player_id = :id
                ORDER BY points DESC
                """
            ),
            {"id": player_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def get_achievements(session: AsyncSession, player_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT a.code, a.name, a.description, a.icon, a.rarity, pa.unlocked_at
                FROM tcg_judge.player_achievements pa
                JOIN tcg_judge.achievements a ON a.id = pa.achievement_id
                WHERE pa.player_id = :id
                ORDER BY pa.unlocked_at DESC
                """
            ),
            {"id": player_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def get_tournament_history(
    session: AsyncSession,
    player_id: str,
    *,
    limit: int = 20,
    offset: int = 0,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT tr.*, t.name AS tournament_name, t.starts_at
                FROM tcg_judge.tournament_results tr
                JOIN tcg_judge.tournaments t ON t.id = tr.tournament_id
                WHERE tr.player_id = :id
                ORDER BY tr.created_at DESC
                LIMIT :lim OFFSET :off
                """
            ),
            {"id": player_id, "lim": limit, "off": offset},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def record_tournament_finalization(
    session: AsyncSession,
    tournament: dict[str, Any],
    standings: list[dict[str, Any]],
) -> list[str]:
    """Atualiza stats, rankings, histórico e conquistas após finalizar torneio."""
    tid = str(tournament["id"])
    game_code = (tournament.get("game_code") or "MTG").upper()
    format_code = (tournament.get("format_code") or "STANDARD").upper()
    is_official = bool(tournament.get("is_official"))
    participants = len(standings)
    unlocked_all: list[str] = []

    for row in standings:
        part = (
            await session.execute(
                text(
                    """
                    SELECT user_id, match_wins, match_losses, match_draws,
                           game_wins, game_losses, status
                    FROM tcg_judge.tournament_participants WHERE id = :pid
                    """
                ),
                {"pid": row["participantId"]},
            )
        ).mappings().first()
        if not part:
            continue
        user_id = part["user_id"]
        await ensure_judge_profile(session, user_id)
        prof = await get_profile_by_id(session, user_id)
        if not prof:
            handle = f"player_{user_id[:8]}"
            await create_profile(session, user_id, handle=handle, display_name=row.get("displayName", handle))

        placement = row["rank"]
        status = part.get("status", "active")
        if status == "dropped":
            placement = 999
        elif status == "disqualified":
            placement = 1000

        pts = calculate_tournament_points(
            placement if placement < 900 else participants,
            participants,
            is_official=is_official,
            perfect_run=part["match_losses"] == 0 and placement == 1,
        )

        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.tournament_results (
                  player_id, tournament_id, placement, total_participants,
                  match_wins, match_losses, match_draws, points_earned,
                  game_code, format_code
                ) VALUES (
                  :pid, :tid, :place, :total, :mw, :ml, :md, :pts, :gc, :fc
                )
                ON CONFLICT (player_id, tournament_id) DO UPDATE SET
                  placement = EXCLUDED.placement, points_earned = EXCLUDED.points_earned
                """
            ),
            {
                "pid": user_id,
                "tid": tid,
                "place": placement,
                "total": participants,
                "mw": part["match_wins"],
                "ml": part["match_losses"],
                "md": part["match_draws"],
                "pts": pts,
                "gc": game_code,
                "fc": format_code,
            },
        )

        won = placement == 1
        top_cut = placement <= 8
        streak_inc = 1 if won else 0

        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.player_game_stats (
                  player_id, game_code, tournaments_played, tournaments_won, top_cuts,
                  matches_won, matches_lost, matches_drawn, game_wins, game_losses,
                  best_finish_placement, best_finish_tournament_id, best_finish_date,
                  win_streak, max_win_streak
                ) VALUES (
                  :pid, :gc, 1, :won, :tc,
                  :mw, :ml, :md, :gw, :gl,
                  :place, :tid, NOW(),
                  :streak, :streak
                )
                ON CONFLICT (player_id, game_code) DO UPDATE SET
                  tournaments_played = player_game_stats.tournaments_played + 1,
                  tournaments_won = player_game_stats.tournaments_won + :won_inc,
                  top_cuts = player_game_stats.top_cuts + :tc_inc,
                  matches_won = player_game_stats.matches_won + :mw,
                  matches_lost = player_game_stats.matches_lost + :ml,
                  matches_drawn = player_game_stats.matches_drawn + :md,
                  game_wins = player_game_stats.game_wins + :gw,
                  game_losses = player_game_stats.game_losses + :gl,
                  best_finish_placement = LEAST(
                    COALESCE(player_game_stats.best_finish_placement, 9999), :place
                  ),
                  best_finish_tournament_id = CASE
                    WHEN :place < COALESCE(player_game_stats.best_finish_placement, 9999)
                    THEN :tid::uuid
                    ELSE player_game_stats.best_finish_tournament_id
                  END,
                  win_streak = CASE
                    WHEN :won_inc = 1 THEN player_game_stats.win_streak + 1 ELSE 0
                  END,
                  max_win_streak = GREATEST(
                    player_game_stats.max_win_streak,
                    CASE WHEN :won_inc = 1 THEN player_game_stats.win_streak + 1 ELSE 0 END
                  ),
                  updated_at = NOW()
                """
            ),
            {
                "pid": user_id,
                "gc": game_code,
                "won": 1 if won else 0,
                "tc": 1 if top_cut else 0,
                "mw": part["match_wins"],
                "ml": part["match_losses"],
                "md": part["match_draws"],
                "gw": part["game_wins"],
                "gl": part["game_losses"],
                "place": placement,
                "tid": tid,
                "streak": streak_inc,
                "won_inc": 1 if won else 0,
                "tc_inc": 1 if top_cut else 0,
            },
        )

        stats_row = (
            await session.execute(
                text("SELECT * FROM tcg_judge.player_game_stats WHERE player_id = :pid AND game_code = :gc"),
                {"pid": user_id, "gc": game_code},
            )
        ).mappings().first()
        stats = dict(stats_row) if stats_row else {}

        rank_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.player_rankings (
                      player_id, game_code, format, points, matches_played, last_tournament_at
                    )
                    VALUES (:pid, :gc, :fc, :pts, 1, NOW())
                    ON CONFLICT (player_id, game_code, format) DO UPDATE SET
                      points = player_rankings.points + :pts,
                      matches_played = player_rankings.matches_played + 1,
                      last_tournament_at = NOW(),
                      last_updated = NOW()
                    RETURNING points
                    """
                ),
                {"pid": user_id, "gc": game_code, "fc": format_code, "pts": pts},
            )
        ).mappings().first()
        total_pts = rank_row["points"] if rank_row else pts
        tier, division = tier_from_points(total_pts)
        await session.execute(
            text(
                """
                UPDATE tcg_judge.player_rankings
                SET tier = :tier, division = :div
                WHERE player_id = :pid AND game_code = :gc AND format = :fc
                """
            ),
            {"tier": tier, "div": division, "pid": user_id, "gc": game_code, "fc": format_code},
        )

        distinct = (
            await session.execute(
                text("SELECT COUNT(DISTINCT game_code) AS c FROM tcg_judge.player_game_stats WHERE player_id = :pid"),
                {"pid": user_id},
            )
        ).mappings().first()

        ctx = {
            **stats,
            "placement": placement,
            "game_code": game_code,
            "match_wins": part["match_wins"],
            "match_losses": part["match_losses"],
            "distinct_games": distinct["c"] if distinct else 1,
        }
        for code in codes_to_unlock(ctx):
            ach = (
                await session.execute(
                    text("SELECT id FROM tcg_judge.achievements WHERE code = :code"),
                    {"code": code},
                )
            ).mappings().first()
            if ach:
                ins = await session.execute(
                    text(
                        """
                        INSERT INTO tcg_judge.player_achievements (player_id, achievement_id)
                        VALUES (:pid, :aid)
                        ON CONFLICT DO NOTHING
                        RETURNING player_id
                        """
                    ),
                    {"pid": user_id, "aid": ach["id"]},
                )
                if ins.mappings().first():
                    unlocked_all.append(code)

    return unlocked_all


async def get_leaderboard(
    session: AsyncSession,
    game_code: str,
    format_code: str,
    *,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT r.points, r.tier, r.division, r.matches_played,
                       p.handle, p.display_name, p.avatar_url, p.id AS player_id,
                       ROW_NUMBER() OVER (ORDER BY r.points DESC) AS rank
                FROM tcg_judge.player_rankings r
                JOIN tcg_judge.player_profiles p ON p.id = r.player_id
                WHERE r.game_code = :gc AND r.format = :fc AND p.privacy_level = 'public'
                ORDER BY r.points DESC
                LIMIT :lim OFFSET :off
                """
            ),
            {"gc": game_code.upper(), "fc": format_code.upper(), "lim": limit, "off": offset},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
