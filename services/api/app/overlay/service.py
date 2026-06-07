"""Payload de overlay para OBS/streaming."""

from __future__ import annotations

from typing import Any

from app.tournament.flow import get_standings
from app.tournament.store import get_tournament, list_pairings_for_round, list_participants
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.tournament.timer import RoundTimer


async def build_overlay_payload(session: AsyncSession, tournament_id: str) -> dict[str, Any]:
    t = await get_tournament(session, tournament_id)
    if not t:
        return {"error": "not_found"}

    current_round = int(t.get("current_round") or 0)
    total_rounds = int(t.get("total_swiss_rounds") or 0)
    standings = await get_standings(session, tournament_id)

    participants = await list_participants(session, tournament_id)
    pmap = {p.id: p for p in participants}

    standings_fmt = [
        {
            "rank": s["rank"],
            "player": s["displayName"],
            "points": s["matchPoints"],
            "record": (
                f"{pmap[s['participantId']].match_wins}-{pmap[s['participantId']].match_losses}-"
                f"{pmap[s['participantId']].match_draws}"
                if s.get("participantId") in pmap
                else "0-0-0"
            ),
        }
        for s in standings[:8]
    ]

    top_pairing = None
    timer_str = ""
    rnd = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.tournament_rounds
                WHERE tournament_id = :tid AND round_number = :rn LIMIT 1
                """
            ),
            {"tid": tournament_id, "rn": current_round},
        )
    ).mappings().first()
    if rnd:
        round_id = str(rnd["id"])
        pairings = await list_pairings_for_round(session, round_id)
        if pairings:
            p = pairings[0]
            top_pairing = {
                "table": p.get("table_number"),
                "player1": p.get("player1_name", "?"),
                "player2": p.get("player2_name") or "Bye",
                "score": p.get("status", "pending"),
            }
        timer_mins = int(t.get("timer_minutes") or 55)
        timer = RoundTimer.load(round_id, timer_mins)
        remaining = timer.remaining_seconds()
        timer_str = f"{remaining // 60:02d}:{remaining % 60:02d}"

    sponsors = (
        await session.execute(
            text(
                """
                SELECT benefits FROM tcg_judge.sponsorships
                WHERE tournament_id = :tid AND status = 'active'
                """
            ),
            {"tid": tournament_id},
        )
    ).mappings().all()

    sponsor_logos = []
    for s in sponsors:
        for b in s.get("benefits") or []:
            if isinstance(b, dict) and b.get("type") == "logo_on_stream":
                sponsor_logos.append(b)

    return {
        "tournament": {
            "name": t.get("name"),
            "round": f"Rodada {current_round} de {total_rounds}" if total_rounds else f"Rodada {current_round}",
            "timer": timer_str,
        },
        "standings": standings_fmt,
        "topPairing": top_pairing,
        "sponsorLogos": sponsor_logos,
    }
