"""Orquestração do fluxo operacional de torneio."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.tournament.engine.bracket import BracketEngine
from app.tournament.engine.swiss import SwissEngine
from app.tournament.engine.prizes import calculate_prizes
from app.tournament.engine.tiebreakers import apply_match_result, recalculate_tiebreakers, sort_standings
from app.tournament.store import (
    activate_round,
    check_in_all_registered,
    complete_round,
    confirm_pairing_result,
    create_round,
    get_pairing,
    get_round,
    get_tournament,
    insert_pairings,
    list_pairings_for_round,
    list_pairings_for_tournament,
    list_participants,
    register_participant,
    report_pairing_result,
    resolve_swiss_rounds,
    save_bracket,
    save_participant_stats,
    update_tournament_status,
    get_active_bracket,
    list_bracket_matches,
    load_bracket_state,
    persist_bracket_matches,
    complete_bracket,
)
from app.tournament.timer import RoundTimer
from app.tournament.types import PairingRecord

_swiss = SwissEngine()
_bracket = BracketEngine()


async def _require_organizer(session: AsyncSession, tournament_id: str, user_id: str) -> dict[str, Any]:
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")
    if str(t.get("created_by")) != user_id:
        raise HTTPException(403, "Apenas o organizador pode executar esta ação")
    return t


async def start_check_in(session: AsyncSession, tournament_id: str, organizer_id: str) -> dict[str, Any]:
    await _require_organizer(session, tournament_id, organizer_id)
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")
    await update_tournament_status(session, tournament_id, status="check_in", phase="check_in")
    await session.commit()
    return {"tournamentId": tournament_id, "status": "check_in"}


async def start_tournament(session: AsyncSession, tournament_id: str, organizer_id: str) -> dict[str, Any]:
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")
    if str(t.get("created_by")) != organizer_id:
        raise HTTPException(403, "Apenas o organizador pode iniciar o torneio")

    count = await check_in_all_registered(session, tournament_id)
    participants = await list_participants(session, tournament_id)
    active = [p for p in participants if p.is_active]
    if len(active) < 2:
        raise HTTPException(400, "Mínimo 2 jogadores com check-in")

    total_rounds = await resolve_swiss_rounds(t, len(active))
    await update_tournament_status(
        session,
        tournament_id,
        status="in_progress",
        phase="between_rounds",
        current_round=0,
        total_swiss_rounds=total_rounds,
    )
    from app.public_api.webhooks import dispatch_webhooks

    await dispatch_webhooks(
        session,
        "tournament.started",
        {"tournamentId": tournament_id, "name": t.get("name"), "players": len(active)},
    )
    await session.commit()
    return {
        "tournamentId": tournament_id,
        "status": "in_progress",
        "checkedIn": count,
        "activePlayers": len(active),
        "totalSwissRounds": total_rounds,
    }


async def generate_next_round(session: AsyncSession, tournament_id: str, organizer_id: str) -> dict[str, Any]:
    await _require_organizer(session, tournament_id, organizer_id)
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")

    current = int(t.get("current_round") or 0)
    total = int(t.get("total_swiss_rounds") or 0)
    next_round = current + 1
    if next_round > total:
        raise HTTPException(400, "Todas as rodadas Swiss já foram geradas")

    participants = await list_participants(session, tournament_id)
    history = await list_pairings_for_tournament(session, tournament_id)
    generated = _swiss.generate_pairings(next_round, participants, history)

    timer_min = int(t.get("timer_minutes") or 50)
    round_row = await create_round(session, tournament_id, next_round, timer_min * 60)
    pairing_rows = await insert_pairings(session, tournament_id, str(round_row["id"]), generated)

    await update_tournament_status(
        session,
        tournament_id,
        status="in_progress",
        phase="round_active",
        current_round=next_round,
    )
    await session.commit()

    return {
        "round": dict(round_row),
        "roundNumber": next_round,
        "pairings": pairing_rows,
        "pairingCount": len(pairing_rows),
    }


async def start_round_timer(
    session: AsyncSession, tournament_id: str, round_number: int, organizer_id: str
) -> dict[str, Any]:
    await _require_organizer(session, tournament_id, organizer_id)
    round_row = await get_round(session, tournament_id, round_number)
    if not round_row:
        raise HTTPException(404, "Rodada não encontrada")
    await activate_round(session, str(round_row["id"]))
    duration = int(round_row["timer_duration_seconds"]) // 60
    timer = RoundTimer(str(round_row["id"]), duration)
    payload = timer.start()
    await session.commit()
    return payload


async def extend_round_timer(
    session: AsyncSession,
    tournament_id: str,
    round_number: int,
    minutes: int,
    organizer_id: str,
) -> dict[str, Any]:
    await _require_organizer(session, tournament_id, organizer_id)
    round_row = await get_round(session, tournament_id, round_number)
    if not round_row:
        raise HTTPException(404, "Rodada não encontrada")
    duration = int(round_row["timer_duration_seconds"]) // 60
    timer = RoundTimer(str(round_row["id"]), duration)
    payload = timer.extend(minutes)
    from sqlalchemy import text

    await session.execute(
        text(
            """
            UPDATE tcg_judge.tournament_rounds
            SET timer_extensions_seconds = timer_extensions_seconds + :ext
            WHERE id = :id
            """
        ),
        {"ext": minutes * 60, "id": str(round_row["id"])},
    )
    await session.commit()
    return payload


async def get_standings(session: AsyncSession, tournament_id: str) -> list[dict[str, Any]]:
    participants = await list_participants(session, tournament_id)
    history = await list_pairings_for_tournament(session, tournament_id)
    pmap = {p.id: p for p in participants}
    recalculate_tiebreakers(pmap, history)
    for p in pmap.values():
        await save_participant_stats(session, p)
    ranked = sort_standings([p for p in participants if p.status != "disqualified"])
    await session.commit()
    return [
        {
            "rank": i + 1,
            "participantId": p.id,
            "displayName": p.display_name,
            "matchPoints": p.match_points,
            "matchWins": p.match_wins,
            "matchLosses": p.match_losses,
            "matchDraws": p.match_draws,
            "omwPercent": p.omw_percent,
            "gwPercent": p.gw_percent,
            "ogwPercent": p.ogw_percent,
            "status": p.status,
        }
        for i, p in enumerate(ranked)
    ]


async def report_result(
    session: AsyncSession,
    tournament_id: str,
    pairing_id: str,
    reporter_user_id: str,
    *,
    player1_wins: int,
    player2_wins: int,
    draws: int = 0,
) -> dict[str, Any]:
    pairing_row = await get_pairing(session, pairing_id)
    if not pairing_row or str(pairing_row["tournament_id"]) != tournament_id:
        raise HTTPException(404, "Pairing não encontrado")

    participants = await list_participants(session, tournament_id)
    {p.id: p for p in participants}
    reporter = next((p for p in participants if p.user_id == reporter_user_id), None)
    if not reporter:
        raise HTTPException(403, "Não inscrito neste torneio")
    if reporter.id not in (str(pairing_row["player1_id"]), str(pairing_row.get("player2_id") or "")):
        raise HTTPException(403, "Apenas jogadores da mesa podem reportar")

    updated = await report_pairing_result(
        session,
        pairing_id,
        reporter.id,
        player1_wins=player1_wins,
        player2_wins=player2_wins,
        draws=draws,
    )
    if not updated:
        raise HTTPException(400, "Não foi possível reportar resultado")
    await session.commit()
    return {"pairing": updated, "status": "reported"}


async def confirm_result(
    session: AsyncSession,
    tournament_id: str,
    pairing_id: str,
    confirmer_user_id: str,
) -> dict[str, Any]:
    pairing_row = await get_pairing(session, pairing_id)
    if not pairing_row:
        raise HTTPException(404, "Pairing não encontrado")

    participants = await list_participants(session, tournament_id)
    pmap = {p.id: p for p in participants}
    confirmer = next((p for p in participants if p.user_id == confirmer_user_id), None)
    if not confirmer:
        raise HTTPException(403, "Não inscrito")
    if confirmer.id == str(pairing_row.get("reported_by")):
        raise HTTPException(400, "O reportador não pode confirmar o próprio resultado")

    updated = await confirm_pairing_result(session, pairing_id, confirmer.id)
    if not updated:
        raise HTTPException(400, "Resultado não está em estado reportado")

    record = PairingRecord(
        id=str(updated["id"]),
        round_number=0,
        table_number=updated["table_number"],
        player1_id=str(updated["player1_id"]),
        player2_id=str(updated["player2_id"]) if updated.get("player2_id") else None,
        is_bye=bool(updated.get("is_bye")),
    )
    apply_match_result(
        record,
        pmap,
        player1_wins=int(updated["player1_wins"]),
        player2_wins=int(updated["player2_wins"]),
        draws=int(updated.get("draws") or 0),
    )
    history = await list_pairings_for_tournament(session, tournament_id)
    recalculate_tiebreakers(pmap, history)
    for p in pmap.values():
        await save_participant_stats(session, p)
    await session.commit()

    standings = await get_standings(session, tournament_id)
    return {"pairing": updated, "status": "confirmed", "standings": standings}


async def end_round(
    session: AsyncSession, tournament_id: str, round_number: int, organizer_id: str
) -> dict[str, Any]:
    await _require_organizer(session, tournament_id, organizer_id)
    round_row = await get_round(session, tournament_id, round_number)
    if not round_row:
        raise HTTPException(404, "Rodada não encontrada")

    pending = await list_pairings_for_round(session, str(round_row["id"]))
    unconfirmed = [p for p in pending if p["status"] not in ("confirmed",) and not p.get("is_bye")]
    if unconfirmed:
        raise HTTPException(400, f"{len(unconfirmed)} mesas sem resultado confirmado")

    await complete_round(session, str(round_row["id"]))
    timer = RoundTimer(str(round_row["id"]), int(round_row["timer_duration_seconds"]) // 60)
    timer.end()

    t = await get_tournament(session, tournament_id)
    current = int(t.get("current_round") or 0)
    total = int(t.get("total_swiss_rounds") or 0)
    phase = "swiss_complete" if current >= total else "between_rounds"
    status = "swiss_complete" if current >= total else "in_progress"

    await update_tournament_status(session, tournament_id, status=status, phase=phase)
    standings = await get_standings(session, tournament_id)
    await session.commit()
    return {"roundNumber": round_number, "phase": phase, "standings": standings}


async def advance_top_cut(session: AsyncSession, tournament_id: str, organizer_id: str) -> dict[str, Any]:
    await _require_organizer(session, tournament_id, organizer_id)
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")

    phase = str(t.get("phase") or t.get("status") or "")
    if phase not in ("swiss_complete",):
        raise HTTPException(400, "Conclua todas as rodadas suíças antes do top cut")

    top_cut = int(t.get("top_cut") or 0)
    if top_cut < 2:
        raise HTTPException(400, "Torneio sem top cut configurado (top_cut >= 2)")

    existing = await get_active_bracket(session, tournament_id)
    if existing and existing.get("status") == "active":
        raise HTTPException(400, "Top cut já foi iniciado")

    standings = await get_standings(session, tournament_id)
    if len(standings) < 2:
        raise HTTPException(400, "Standings insuficientes para top cut")

    participants = await list_participants(session, tournament_id)
    pmap = {p.id: p for p in participants}
    ranked: list[Any] = []
    for row in standings[:top_cut]:
        pid = str(row.get("participantId") or row.get("id") or "")
        if pid in pmap:
            ranked.append(pmap[pid])
    if len(ranked) < 2:
        raise HTTPException(400, "Menos de 2 jogadores ativos no top cut")

    bracket = _bracket.generate_single_elimination(tournament_id, ranked, min(top_cut, len(ranked)))
    bracket_id = await save_bracket(session, bracket)
    await update_tournament_status(session, tournament_id, status="bracket_active", phase="bracket_active")
    await session.commit()
    return {
        "bracketId": bracket_id,
        "topCut": top_cut,
        "matches": [
            {
                "id": m.id,
                "roundNumber": m.round_number,
                "matchNumber": m.match_number,
                "player1Id": m.player1_id,
                "player2Id": m.player2_id,
                "tableNumber": m.table_number,
                "status": m.status,
            }
            for m in bracket.matches
        ],
    }


async def get_bracket(session: AsyncSession, tournament_id: str) -> dict[str, Any]:
    bracket_row = await get_active_bracket(session, tournament_id)
    if not bracket_row:
        raise HTTPException(404, "Bracket não encontrado")
    matches = await list_bracket_matches(session, str(bracket_row["id"]))
    return {
        "bracketId": str(bracket_row["id"]),
        "tournamentId": tournament_id,
        "topCut": int(bracket_row["top_cut"]),
        "status": str(bracket_row["status"]),
        "matches": [
            {
                "id": str(m["id"]),
                "roundNumber": int(m["round_number"]),
                "matchNumber": int(m["match_number"]),
                "player1Id": str(m["player1_id"]) if m.get("player1_id") else None,
                "player2Id": str(m["player2_id"]) if m.get("player2_id") else None,
                "player1Name": m.get("player1_name"),
                "player2Name": m.get("player2_name"),
                "winnerId": str(m["winner_id"]) if m.get("winner_id") else None,
                "nextMatchId": str(m["next_match_id"]) if m.get("next_match_id") else None,
                "tableNumber": m.get("table_number"),
                "status": str(m.get("status") or "pending"),
            }
            for m in matches
        ],
    }


async def report_bracket_result(
    session: AsyncSession,
    tournament_id: str,
    match_id: str,
    organizer_id: str,
    winner_id: str,
) -> dict[str, Any]:
    await _require_organizer(session, tournament_id, organizer_id)
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")
    if str(t.get("phase") or "") not in ("bracket_active",):
        raise HTTPException(400, "Top cut não está ativo")

    bracket_row = await get_active_bracket(session, tournament_id)
    if not bracket_row or bracket_row.get("status") != "active":
        raise HTTPException(404, "Bracket ativo não encontrado")

    state = await load_bracket_state(session, str(bracket_row["id"]))
    match = next((m for m in state.matches if m.id == match_id), None)
    if not match:
        raise HTTPException(404, "Partida não encontrada")
    if match.status == "completed":
        raise HTTPException(400, "Partida já finalizada")
    if winner_id not in (match.player1_id, match.player2_id):
        raise HTTPException(400, "Vencedor deve ser um dos jogadores da partida")

    _bracket.advance_winner(state, match_id, winner_id)
    updated_ids = {match_id}
    if match.next_match_id:
        updated_ids.add(match.next_match_id)
    to_persist = [m for m in state.matches if m.id in updated_ids]
    await persist_bracket_matches(session, to_persist)

    final_round = max(m.round_number for m in state.matches)
    final_match = next(m for m in state.matches if m.round_number == final_round and m.match_number == 1)
    bracket_complete = bool(final_match.winner_id)
    if bracket_complete:
        await complete_bracket(session, str(bracket_row["id"]))
        await update_tournament_status(session, tournament_id, status="bracket_complete", phase="bracket_complete")

    await session.commit()
    return {
        "matchId": match_id,
        "winnerId": winner_id,
        "bracketComplete": bracket_complete,
        "bracket": await get_bracket(session, tournament_id),
    }


async def finalize_tournament(session: AsyncSession, tournament_id: str, organizer_id: str) -> dict[str, Any]:
    t = await _require_organizer(session, tournament_id, organizer_id)
    phase = str(t.get("phase") or t.get("status") or "")
    if phase == "bracket_active":
        raise HTTPException(400, "Conclua o top cut antes de finalizar o torneio")

    standings = await get_standings(session, tournament_id)

    bracket_row = await get_active_bracket(session, tournament_id)
    if bracket_row and bracket_row.get("status") == "completed":
        matches = await list_bracket_matches(session, str(bracket_row["id"]))
        if matches:
            final_round = max(int(m["round_number"]) for m in matches)
            final = next(
                (m for m in matches if int(m["round_number"]) == final_round and int(m["match_number"]) == 1),
                None,
            )
            if final and final.get("winner_id"):
                winner_pid = str(final["winner_id"])
                winner_row = next(
                    (s for s in standings if str(s.get("participantId")) == winner_pid),
                    None,
                )
                if winner_row:
                    rest = [s for s in standings if str(s.get("participantId")) != winner_pid]
                    standings = [winner_row, *rest]
                    for i, s in enumerate(standings):
                        s["rank"] = i + 1

    total_prize = float(t.get("prize_pool") or 0)
    currency = str(t.get("prize_currency") or "BRL")
    prizes = calculate_prizes(standings, total_prize=total_prize, currency=currency) if total_prize > 0 else []
    await update_tournament_status(session, tournament_id, status="finalized", phase="finalized")

    from app.leagues.scoring import update_league_standings_from_tournament
    from app.notifications.service import notification_service
    from app.players.store import record_tournament_finalization

    unlocked = await record_tournament_finalization(session, dict(t), standings)

    league_evt = (
        await session.execute(
            text(
                """
                SELECT league_id, points_multiplier FROM tcg_judge.league_events
                WHERE tournament_id = :tid LIMIT 1
                """
            ),
            {"tid": tournament_id},
        )
    ).mappings().first()
    if league_evt:
        pts_map: dict[str, int] = {}
        for row in standings:
            part = (
                await session.execute(
                    text("SELECT user_id FROM tcg_judge.tournament_participants WHERE id = :pid"),
                    {"pid": row["participantId"]},
                )
            ).mappings().first()
            if part:
                pts_map[part["user_id"]] = max(1, 100 - row["rank"] * 5)
        await update_league_standings_from_tournament(
            session,
            str(league_evt["league_id"]),
            tournament_id,
            pts_map,
            float(league_evt["points_multiplier"] or 1.0),
        )

    participant_ids: list[str] = []
    for row in standings:
        part = (
            await session.execute(
                text("SELECT user_id FROM tcg_judge.tournament_participants WHERE id = :pid"),
                {"pid": row["participantId"]},
            )
        ).mappings().first()
        if part:
            participant_ids.append(part["user_id"])

    await notification_service.send(
        session,
        "tournament:finished",
        player_ids=participant_ids,
        body=f"Torneio {t.get('name', '')} finalizado.",
        data={"tournamentId": tournament_id},
        channels=["in_app", "push", "email"],
    )
    for code in unlocked:
        ach_players = (
            await session.execute(
                text(
                    """
                    SELECT pa.player_id FROM tcg_judge.player_achievements pa
                    JOIN tcg_judge.achievements a ON a.id = pa.achievement_id
                    WHERE a.code = :code AND pa.unlocked_at >= NOW() - INTERVAL '1 minute'
                    """
                ),
                {"code": code},
            )
        ).mappings().all()
        for ap in ach_players:
            await notification_service.send(
                session,
                "achievement:unlocked",
                player_ids=[ap["player_id"]],
                body=f"Conquista desbloqueada: {code}",
                data={"achievementCode": code},
                channels=["in_app", "push"],
            )

    from app.public_api.webhooks import dispatch_webhooks

    await dispatch_webhooks(
        session,
        "tournament.ended",
        {"tournamentId": tournament_id, "name": t.get("name"), "standings": standings[:8]},
    )

    await session.commit()
    return {
        "tournamentId": tournament_id,
        "status": "finalized",
        "standings": standings,
        "prizes": prizes,
        "achievementsUnlocked": unlocked,
    }


async def register_player(
    session: AsyncSession,
    tournament_id: str,
    user_id: str,
    display_name: str | None = None,
) -> dict[str, Any]:
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")
    if t.get("status") not in ("draft", "published", "registration_open", "open"):
        raise HTTPException(400, "Inscrições fechadas")
    p = await register_participant(session, tournament_id, user_id, display_name)
    await session.commit()
    return {"participantId": p.id, "userId": p.user_id, "status": p.status}
