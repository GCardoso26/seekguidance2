"""Tournament Platform API — /runtime/judge/tournament-platform/* + /runtime/* read aliases."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.tournament_platform.domain.enums import (
    CheckinMethod,
    JudgeStaffRole,
    PenaltyType,
    PrizeType,
    RegistrationStatus,
    StoreEventType,
)
from app.tournament_platform.permissions import can_event
from app.tournament_platform.services import (
    AnalyticsMartService,
    CheckinService,
    DashboardService,
    DecklistService,
    EventService,
    JudgeService,
    MatchService,
    PairingService,
    PenaltyService,
    PrizeService,
    RegistrationService,
    RoundService,
    StandingService,
    TicketService,
    TournamentOrgService,
)

router = APIRouter(tags=["tournament-platform"])
tp = APIRouter(prefix="/runtime/judge/tournament-platform", tags=["tournament-platform"])


class EventCreateBody(BaseModel):
    store_id: str
    name: str
    description: str | None = None
    game: str | None = None
    format: str | None = None
    category: str | None = None
    event_type: StoreEventType = StoreEventType.TOURNAMENT
    capacity: int | None = None
    starts_at: str | None = None
    venue: str | None = None
    rules: str | None = None
    policies: dict[str, Any] | None = None


class TicketCreateBody(BaseModel):
    name: str = "Entry"
    price_cents: int = 0
    quantity: int = 0
    capacity: int | None = None
    tournament_id: str | None = None
    store_product_id: str | None = None
    lot: str | None = None


class RegisterBody(BaseModel):
    store_event_id: str
    tournament_id: str | None = None
    ticket_id: str | None = None


class AdvanceRegBody(BaseModel):
    status: RegistrationStatus


class CheckinBody(BaseModel):
    registration_id: str
    method: CheckinMethod = CheckinMethod.MANUAL
    tournament_id: str | None = None
    notes: str | None = None
    actor_role: str | None = None


class StaffBody(BaseModel):
    user_id: str
    role: JudgeStaffRole = JudgeStaffRole.FLOOR_JUDGE
    store_event_id: str | None = None


class PenaltyBody(BaseModel):
    participant_user_id: str
    penalty_type: PenaltyType
    notes: str | None = None


class PrizeBody(BaseModel):
    prize_type: PrizeType
    rank_from: int = 1
    rank_to: int = 1
    amount_cents: int | None = None
    points: int | None = None
    description: str | None = None
    product_ref: str | None = None
    auto_distribute: bool = False


class LinkTournamentBody(BaseModel):
    tournament_id: str
    store_id: str | None = None


class DecklistBody(BaseModel):
    file_name: str | None = None
    source: str = "upload"
    content: str | None = Field(default=None, max_length=200_000)


# --- writes / platform ---


@tp.post("/events")
async def create_event(
    body: EventCreateBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    if not await can_event(session, user_id, store_id=body.store_id, action="create"):
        raise HTTPException(status_code=403, detail="forbidden_event_create")
    ev = await EventService(session).create(
        store_id=body.store_id,
        name=body.name,
        organizer_id=user_id,
        description=body.description,
        game=body.game,
        format=body.format,
        category=body.category,
        event_type=body.event_type,
        capacity=body.capacity,
        starts_at=body.starts_at,
        venue=body.venue,
        rules=body.rules,
        policies=body.policies,
    )
    return {"event": ev.to_dict()}


@tp.get("/events/{event_id}")
async def get_event(event_id: str, session: DbSession) -> dict[str, Any]:
    ev = await EventService(session).get(event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="event_not_found")
    tournaments = await TournamentOrgService(session).list_tournaments(event_id)
    return {"event": ev.to_dict(), "tournaments": tournaments}


@tp.post("/events/{event_id}/link-tournament")
async def link_tournament(
    event_id: str,
    body: LinkTournamentBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    await TournamentOrgService(session).link(event_id, body.tournament_id, store_id=body.store_id)
    return {"ok": True, "store_event_id": event_id, "tournament_id": body.tournament_id}


@tp.post("/events/{event_id}/tickets")
async def create_ticket(
    event_id: str,
    body: TicketCreateBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    ticket = await TicketService(session).create(
        store_event_id=event_id,
        name=body.name,
        price_cents=body.price_cents,
        quantity=body.quantity,
        capacity=body.capacity,
        tournament_id=body.tournament_id,
        store_product_id=body.store_product_id,
        lot=body.lot,
    )
    return {"ticket": ticket.to_dict()}


@tp.get("/events/{event_id}/tickets")
async def list_tickets(event_id: str, session: DbSession) -> dict[str, Any]:
    return {"tickets": await TicketService(session).list_for_event(event_id)}


@tp.post("/registrations")
async def register(
    body: RegisterBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    reg = await RegistrationService(session).create(
        store_event_id=body.store_event_id,
        user_id=user_id,
        tournament_id=body.tournament_id,
        ticket_id=body.ticket_id,
    )
    return {"registration": reg.to_dict()}


@tp.post("/registrations/{registration_id}/advance")
async def advance_registration(
    registration_id: str,
    body: AdvanceRegBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    reg = await RegistrationService(session).advance(registration_id, body.status)
    return {"registration": reg.to_dict()}


@tp.post("/checkins")
async def do_checkin(
    body: CheckinBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    rec = await CheckinService(session).check_in(
        registration_id=body.registration_id,
        method=body.method,
        actor_user_id=user_id,
        actor_role=body.actor_role,
        notes=body.notes,
        tournament_id=body.tournament_id,
    )
    return {"checkin": rec.to_dict()}


@tp.post("/tournaments/{tournament_id}/staff")
async def assign_staff(
    tournament_id: str,
    body: StaffBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    staff = await JudgeService(session).assign(
        tournament_id=tournament_id,
        user_id=body.user_id,
        role=body.role,
        store_event_id=body.store_event_id,
    )
    return {"staff": staff.to_dict()}


@tp.post("/tournaments/{tournament_id}/penalties")
async def apply_penalty(
    tournament_id: str,
    body: PenaltyBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    pen = await PenaltyService(session).apply(
        tournament_id=tournament_id,
        participant_user_id=body.participant_user_id,
        penalty_type=body.penalty_type,
        judge_user_id=user_id,
        notes=body.notes,
    )
    return {"penalty": pen.to_dict()}


@tp.post("/tournaments/{tournament_id}/prizes")
async def allocate_prize(
    tournament_id: str,
    body: PrizeBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    prize = await PrizeService(session).allocate(
        tournament_id=tournament_id,
        prize_type=body.prize_type,
        rank_from=body.rank_from,
        rank_to=body.rank_to,
        amount_cents=body.amount_cents,
        points=body.points,
        description=body.description,
        product_ref=body.product_ref,
        auto_distribute=body.auto_distribute,
    )
    return {"prize": prize.to_dict()}


@tp.post("/tournaments/{tournament_id}/decklists")
async def archive_decklist(
    tournament_id: str,
    body: DecklistBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    arch = await DecklistService(session).archive(
        tournament_id=tournament_id,
        user_id=user_id,
        source=body.source,
        file_name=body.file_name,
        content=body.content,
    )
    return {"decklist": arch.to_dict()}


@tp.get("/pairing-formats")
async def pairing_formats(session: DbSession) -> dict[str, Any]:
    return {"formats": PairingService(session).describe_formats()}


# --- read aliases (brief) ---


@router.get("/runtime/events")
async def runtime_events(
    session: DbSession,
    store_id: str | None = Query(default=None),
) -> dict[str, Any]:
    if store_id:
        events = await EventService(session).list_for_store(store_id)
    else:
        events = await EventService(session).list_public()
    return {"events": [e.to_dict() for e in events]}


@router.get("/runtime/event-dashboard")
async def runtime_event_dashboard(
    session: DbSession,
    store_event_id: str = Query(...),
) -> dict[str, Any]:
    dash = await DashboardService(session).event_dashboard(store_event_id)
    mart = await AnalyticsMartService(session).event_mart(store_event_id)
    return {**dash, "mart": mart}


@router.get("/runtime/player-dashboard")
async def runtime_player_dashboard(
    session: DbSession,
    tournament_id: str = Query(...),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await DashboardService(session).player_dashboard(user_id, tournament_id)


@router.get("/runtime/judge-dashboard")
async def runtime_judge_dashboard(
    session: DbSession,
    tournament_id: str = Query(...),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await DashboardService(session).judge_dashboard(tournament_id)


@router.get("/runtime/standings")
async def runtime_standings(
    session: DbSession,
    tournament_id: str = Query(...),
) -> dict[str, Any]:
    return {"standings": await StandingService(session).get(tournament_id)}


@router.get("/runtime/pairings")
async def runtime_pairings(
    session: DbSession,
    tournament_id: str = Query(...),
) -> dict[str, Any]:
    return await PairingService(session).current(tournament_id)


@router.get("/runtime/checkins")
async def runtime_checkins(
    session: DbSession,
    tournament_id: str = Query(...),
) -> dict[str, Any]:
    return {"checkins": await CheckinService(session).list_for_tournament(tournament_id)}


@router.get("/runtime/tournament-health")
async def runtime_tournament_health(
    session: DbSession,
    tournament_id: str = Query(...),
) -> dict[str, Any]:
    return await AnalyticsMartService(session).health(tournament_id)


@router.get("/runtime/store-event-dashboard")
async def runtime_store_dashboard(
    session: DbSession,
    store_id: str = Query(...),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await DashboardService(session).store_dashboard(store_id)


@tp.get("/tournaments/{tournament_id}/rounds/current")
async def current_round(tournament_id: str, session: DbSession) -> dict[str, Any]:
    return await RoundService(session).current_view(tournament_id)


@tp.get("/tournaments/{tournament_id}/matches")
async def matches(tournament_id: str, session: DbSession) -> dict[str, Any]:
    return await MatchService(session).list_current(tournament_id)


router.include_router(tp)
