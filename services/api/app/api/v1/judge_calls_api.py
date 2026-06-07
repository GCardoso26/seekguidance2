"""API — Painel Juiz Digital (chamadas de juiz em torneios)."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.judge import calls_store
from app.judge.models import (
    EscalationData,
    JudgeCallCreate,
    JudgeCallResolve,
    JudgeCallResponse,
    JudgeCertificationResponse,
    RulingCategory,
)
from app.notifications.service import notification_service
from fastapi import APIRouter, Header, HTTPException, Query

router = APIRouter(prefix="/runtime/judge/judge", tags=["judge-calls"])

PENALTY_CATEGORIES = {
    RulingCategory.WARNING,
    RulingCategory.GAME_LOSS,
    RulingCategory.MATCH_LOSS,
    RulingCategory.DISQUALIFICATION,
}


def _to_response(row: dict[str, Any]) -> JudgeCallResponse:
    return JudgeCallResponse(
        id=str(row["id"]),
        tournament_id=str(row["tournament_id"]),
        round_id=str(row["round_id"]) if row.get("round_id") else None,
        table_number=int(row["table_number"]),
        caller_id=row.get("caller_id"),
        type=str(row["type"]),
        priority=str(row["priority"]),
        status=str(row["status"]),
        description=str(row["description"]),
        evidence_urls=list(row.get("evidence_urls") or []),
        assigned_judge_id=row.get("assigned_judge_id"),
        ruling=row.get("ruling"),
        ruling_category=row.get("ruling_category"),
        created_at=row["created_at"],
        assigned_at=row.get("assigned_at"),
        resolved_at=row.get("resolved_at"),
        tournament_name=row.get("tournament_name"),
        tournament_game_code=row.get("tournament_game_code"),
        caller_handle=row.get("caller_handle"),
        round_number=row.get("round_number"),
    )


@router.get("/certifications/me", response_model=list[JudgeCertificationResponse])
async def my_certifications(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[JudgeCertificationResponse]:
    user_id = _require_user(x_judge_user_id)
    rows = await calls_store.list_certifications(session, user_id)
    return [
        JudgeCertificationResponse(
            id=str(r["id"]),
            player_id=r["player_id"],
            game_code=r["game_code"],
            level=r["level"],
            status=r["status"],
            certified_at=r["certified_at"],
            expires_at=r.get("expires_at"),
        )
        for r in rows
    ]


@router.post("/calls", response_model=JudgeCallResponse)
async def create_call(
    data: JudgeCallCreate,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> JudgeCallResponse:
    user_id = _require_user(x_judge_user_id)
    participant = await calls_store.get_active_participant(session, data.tournament_id, user_id)
    if not participant:
        raise HTTPException(403, "You are not an active participant in this tournament")

    call = await calls_store.create_call(
        session,
        {
            "tournament_id": data.tournament_id,
            "round_id": data.round_id,
            "table_number": data.table_number,
            "caller_id": user_id,
            "caller_participant_id": str(participant["id"]),
            "type": data.type.value,
            "priority": data.priority.value,
            "description": data.description,
            "evidence_urls": data.evidence_urls,
        },
    )
    await session.commit()

    game_code = call.get("tournament_game_code") or await calls_store.get_tournament_game_code(
        session, data.tournament_id
    )
    if game_code:
        judge_ids = await calls_store.list_certified_judges_for_game(session, game_code)
        if judge_ids:
            await notification_service.send(
                session,
                "judge_call:open",
                player_ids=judge_ids,
                body=f"Mesa {data.table_number}: {data.type.value}",
                data={"call_id": call["id"], "tournament_id": data.tournament_id},
            )
            await session.commit()

    return _to_response(call)


@router.get("/calls", response_model=list[JudgeCallResponse])
async def list_calls(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    tournament_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    assigned_to_me: bool = Query(default=False),
    open_calls: bool = Query(default=False),
) -> list[JudgeCallResponse]:
    user_id = _require_user(x_judge_user_id)
    rows: list[dict[str, Any]] = []

    if assigned_to_me:
        cert = await calls_store.get_active_certification(session, user_id)
        if not cert:
            raise HTTPException(403, "Certificação de juiz necessária")
        rows = await calls_store.list_calls(
            session,
            assigned_judge_id=user_id,
            status=status,
            tournament_id=tournament_id,
        )
    elif open_calls:
        cert = await calls_store.get_active_certification(session, user_id)
        if not cert:
            raise HTTPException(403, "Certificação de juiz necessária")
        rows = await calls_store.list_calls(
            session,
            open_for_judge=True,
            judge_game_code=cert["game_code"],
            tournament_id=tournament_id,
        )
    elif tournament_id:
        organizer = await calls_store.get_tournament_organizer(session, tournament_id)
        if organizer != user_id:
            raise HTTPException(403, "Apenas o organizador pode ver todas as chamadas")
        rows = await calls_store.list_calls(
            session,
            tournament_id=tournament_id,
            status=status,
            organizer_id=user_id,
        )
    else:
        rows = await calls_store.list_calls(session, caller_id=user_id, status=status)

    return [_to_response(r) for r in rows]


@router.post("/calls/{call_id}/accept", response_model=JudgeCallResponse)
async def accept_call(
    call_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> JudgeCallResponse:
    user_id = _require_user(x_judge_user_id)
    call = await calls_store.get_call(session, call_id)
    if not call or call["status"] != "open":
        raise HTTPException(404, "Call not found or not open")

    game_code = call.get("tournament_game_code") or await calls_store.get_tournament_game_code(
        session, str(call["tournament_id"])
    )
    cert = await calls_store.get_active_certification(session, user_id, game_code)
    if not cert:
        raise HTTPException(403, "You are not a certified judge for this game")

    updated = await calls_store.accept_call(session, call_id, user_id)
    if not updated:
        raise HTTPException(409, "Chamada já atribuída ou indisponível")
    await session.commit()

    if call.get("caller_id"):
        await notification_service.send(
            session,
            "judge_call:accepted",
            player_ids=[call["caller_id"]],
            body=f"Juiz a caminho da mesa {call['table_number']}",
            data={"call_id": call_id},
        )
        await session.commit()

    return _to_response(updated)


@router.post("/calls/{call_id}/resolve", response_model=JudgeCallResponse)
async def resolve_call(
    call_id: str,
    data: JudgeCallResolve,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> JudgeCallResponse:
    user_id = _require_user(x_judge_user_id)
    call = await calls_store.get_call(session, call_id)
    if not call or call.get("assigned_judge_id") != user_id:
        raise HTTPException(403, "You are not assigned to this call")

    game_code = call.get("tournament_game_code") or await calls_store.get_tournament_game_code(
        session, str(call["tournament_id"])
    )

    if data.ruling_category in PENALTY_CATEGORIES and not data.infracting_player_id:
        raise HTTPException(400, "infracting_player_id required for penalties")

    updated = await calls_store.resolve_call(
        session,
        call_id,
        user_id,
        ruling=data.ruling,
        ruling_category=data.ruling_category.value,
        infracting_player_id=data.infracting_player_id,
        infraction_type=data.infraction_type,
        severity=data.severity,
        tournament_id=str(call["tournament_id"]),
        game_code=game_code,
    )
    if not updated:
        raise HTTPException(409, "Não foi possível resolver a chamada")
    await session.commit()

    notify_ids = [pid for pid in [call.get("caller_id"), data.infracting_player_id] if pid]
    if notify_ids:
        await notification_service.send(
            session,
            "judge_call:resolved",
            player_ids=list(set(notify_ids)),
            body=data.ruling[:200],
            data={"call_id": call_id, "ruling_category": data.ruling_category.value},
        )
        await session.commit()

    return _to_response(updated)


@router.post("/calls/{call_id}/escalate", response_model=JudgeCallResponse)
async def escalate_call(
    call_id: str,
    data: EscalationData,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> JudgeCallResponse:
    user_id = _require_user(x_judge_user_id)
    call = await calls_store.get_call(session, call_id)
    if not call or call.get("assigned_judge_id") != user_id:
        raise HTTPException(403, "Not your call")

    organizer_id = await calls_store.get_tournament_organizer(session, str(call["tournament_id"]))
    if not organizer_id:
        raise HTTPException(400, "Organizador do torneio não encontrado")

    updated = await calls_store.escalate_call(
        session,
        call_id,
        user_id,
        escalated_to=organizer_id,
        reason=data.reason,
    )
    if not updated:
        raise HTTPException(409, "Não foi possível escalar")
    await session.commit()

    await notification_service.send(
        session,
        "judge_call:escalated",
        player_ids=[organizer_id],
        body=data.reason[:200],
        data={"call_id": call_id},
    )
    await session.commit()

    return _to_response(updated)
