"""API do fluxo operacional de torneio — rodadas, timer, resultados, standings."""

from __future__ import annotations

import json
from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.tournament import flow
from app.tournament.store import get_round, get_tournament, list_pairings_for_round
from app.tournament.timer import RoundTimer, get_last_timer_event, subscribe_timer_events
from fastapi import APIRouter, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

router = APIRouter(tags=["tournament-flow"])


class RegisterBody(BaseModel):
    display_name: str | None = None


class ReportResultBody(BaseModel):
    player1_wins: int = Field(ge=0, le=2)
    player2_wins: int = Field(ge=0, le=2)
    draws: int = Field(default=0, ge=0)


class ExtendTimerBody(BaseModel):
    minutes: int = Field(default=5, ge=1, le=30)


@router.get("/runtime/judge/tournaments/{tournament_id}")
async def get_tournament_detail(session: DbSession, tournament_id: str) -> dict[str, Any]:
    t = await get_tournament(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")
    return dict(t)


@router.post("/runtime/judge/tournaments/{tournament_id}/register")
async def register_for_tournament(
    tournament_id: str,
    session: DbSession,
    body: RegisterBody | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await flow.register_player(
        session,
        tournament_id,
        user_id,
        body.display_name if body else None,
    )


@router.post("/runtime/judge/tournaments/{tournament_id}/start-check-in")
async def start_check_in(
    tournament_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await flow.start_check_in(session, tournament_id)


@router.post("/runtime/judge/tournaments/{tournament_id}/start")
async def start_tournament(
    tournament_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await flow.start_tournament(session, tournament_id, user_id)


@router.post("/runtime/judge/tournaments/{tournament_id}/rounds")
async def create_next_round(
    tournament_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await flow.generate_next_round(session, tournament_id)


@router.get("/runtime/judge/tournaments/{tournament_id}/rounds/{round_number}")
async def get_round_pairings(
    tournament_id: str,
    round_number: int,
    session: DbSession,
) -> dict[str, Any]:
    round_row = await get_round(session, tournament_id, round_number)
    if not round_row:
        raise HTTPException(404, "Rodada não encontrada")
    pairings = await list_pairings_for_round(session, str(round_row["id"]))
    return {"round": dict(round_row), "pairings": pairings}


@router.post("/runtime/judge/tournaments/{tournament_id}/rounds/{round_number}/start")
async def start_round(
    tournament_id: str,
    round_number: int,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await flow.start_round_timer(session, tournament_id, round_number)


@router.post("/runtime/judge/tournaments/{tournament_id}/rounds/{round_number}/extend")
async def extend_round(
    tournament_id: str,
    round_number: int,
    body: ExtendTimerBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await flow.extend_round_timer(session, tournament_id, round_number, body.minutes)


@router.post("/runtime/judge/tournaments/{tournament_id}/rounds/{round_number}/end")
async def end_round_endpoint(
    tournament_id: str,
    round_number: int,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await flow.end_round(session, tournament_id, round_number)


@router.post(
    "/runtime/judge/tournaments/{tournament_id}/rounds/{round_number}/pairings/{pairing_id}/report"
)
async def report_pairing(
    tournament_id: str,
    round_number: int,
    pairing_id: str,
    body: ReportResultBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await flow.report_result(
        session,
        tournament_id,
        pairing_id,
        user_id,
        player1_wins=body.player1_wins,
        player2_wins=body.player2_wins,
        draws=body.draws,
    )


@router.post(
    "/runtime/judge/tournaments/{tournament_id}/rounds/{round_number}/pairings/{pairing_id}/confirm"
)
async def confirm_pairing(
    tournament_id: str,
    round_number: int,
    pairing_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await flow.confirm_result(session, tournament_id, pairing_id, user_id)


@router.get("/runtime/judge/tournaments/{tournament_id}/standings")
async def standings(tournament_id: str, session: DbSession) -> list[dict[str, Any]]:
    return await flow.get_standings(session, tournament_id)


@router.post("/runtime/judge/tournaments/{tournament_id}/advance-top-cut")
async def advance_top_cut(
    tournament_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await flow.advance_top_cut(session, tournament_id)


@router.post("/runtime/judge/tournaments/{tournament_id}/finalize")
async def finalize(
    tournament_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await flow.finalize_tournament(session, tournament_id)


@router.get("/runtime/judge/tournament/timers/{round_id}")
async def get_timer_state(round_id: str, session: DbSession) -> dict[str, Any]:
    from app.tournament.store import get_round_by_id

    round_row = await get_round_by_id(session, round_id)
    if not round_row:
        raise HTTPException(404, "Rodada não encontrada")
    duration = int(round_row["timer_duration_seconds"]) // 60
    timer = RoundTimer.load(round_id, duration)
    return timer.to_dict()


@router.websocket("/runtime/judge/tournament/timers/{round_id}/ws")
async def timer_websocket(websocket: WebSocket, round_id: str) -> None:
    await websocket.accept()
    try:
        async for event in subscribe_timer_events(round_id):
            await websocket.send_json(event)
            if event.get("status") == "ended" or event.get("type") == "timer:ended":
                break
    except WebSocketDisconnect:
        pass
    except Exception:
        last = get_last_timer_event(round_id)
        if last:
            await websocket.send_json(last)


@router.post("/runtime/judge/tournament/admin/sync-cards/{game_code}")
async def sync_cards(
    game_code: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    from app.tcg_adapters.sync_lorcana import sync_lorcana
    from app.tcg_adapters.sync_mtg import sync_scryfall
    from app.tcg_adapters.sync_pokemon import sync_tcgdex

    code = game_code.upper()
    if code == "MTG":
        return await sync_scryfall(session, limit=200)
    if code == "POKEMON":
        return await sync_tcgdex(session, max_sets=1)
    if code == "LORCANA":
        return await sync_lorcana(session)
    raise HTTPException(400, f"Sync não disponível para {game_code}")


@router.get("/runtime/judge/tournament/timers/{round_id}/stream")
async def timer_sse(round_id: str) -> StreamingResponse:
    async def generate():
        async for event in subscribe_timer_events(round_id):
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("status") == "ended" or event.get("type") == "timer:ended":
                break

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
