"""Check-in, Judge, Penalty, Prize, Decklist, Engine facades, Dashboards."""

from __future__ import annotations

import hashlib
import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.tournament_platform.adapters.rc1_pairings import (
    assert_format_or_raise,
    format_support,
    get_pairings_for_current_round,
    get_standings,
)
from app.tournament_platform.adapters.rc1_tournament import (
    get_tournament_row,
    list_participants_projection,
    list_tournaments_for_store,
)
from app.tournament_platform.domain import (
    CheckinRecord,
    DecklistArchive,
    PenaltyRecord,
    PrizeAllocation,
    StaffAssignment,
)
from app.tournament_platform.domain.enums import (
    CheckinMethod,
    JudgeStaffRole,
    PairingFormat,
    PenaltyType,
    PrizeType,
    RegistrationStatus,
)
from app.tournament_platform.observability import emit
from app.tournament_platform.services.core_services import RegistrationService


class CheckinService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def check_in(
        self,
        *,
        registration_id: str,
        method: CheckinMethod = CheckinMethod.MANUAL,
        actor_user_id: str | None = None,
        actor_role: str | None = None,
        notes: str | None = None,
        tournament_id: str | None = None,
    ) -> CheckinRecord:
        reg = await RegistrationService(self.session).advance(
            registration_id, RegistrationStatus.CHECKED_IN
        )
        cid = str(uuid.uuid4())
        tid = tournament_id or reg.tournament_id
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.event_checkins (
                  id, registration_id, tournament_id, method, actor_user_id, actor_role, notes
                ) VALUES (
                  CAST(:id AS uuid), CAST(:rid AS uuid),
                  CASE WHEN :tid IS NULL THEN NULL ELSE CAST(:tid AS uuid) END,
                  :method, :actor, :role, :notes
                )
                """
            ),
            {
                "id": cid,
                "rid": registration_id,
                "tid": tid,
                "method": method.value,
                "actor": actor_user_id,
                "role": actor_role,
                "notes": notes,
            },
        )
        await self.session.commit()
        emit("checkin_completed", {"registration_id": registration_id, "method": method.value})
        return CheckinRecord(
            id=cid,
            registration_id=registration_id,
            tournament_id=tid,
            method=method,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            notes=notes,
        )

    async def list_for_tournament(self, tournament_id: str) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, registration_id::text, tournament_id::text, method,
                           actor_user_id, actor_role, notes, created_at::text
                    FROM tcg_judge.event_checkins
                    WHERE tournament_id = CAST(:tid AS uuid)
                    ORDER BY created_at DESC
                    """
                ),
                {"tid": tournament_id},
            )
        ).mappings().all()
        if rows:
            return [dict(r) for r in rows]
        # Dual-read: participants checked_in_at
        parts = await list_participants_projection(self.session, tournament_id)
        return [
            {
                "method": "list",
                "user_id": p.get("user_id"),
                "display_name": p.get("display_name"),
                "checked_in_at": p.get("checked_in_at"),
                "source": "rc1_participants",
            }
            for p in parts
            if p.get("status") in ("checked_in", "active") or p.get("checked_in_at")
        ]


class JudgeService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def assign(
        self,
        *,
        tournament_id: str,
        user_id: str,
        role: JudgeStaffRole,
        store_event_id: str | None = None,
    ) -> StaffAssignment:
        sid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.tournament_staff (
                  id, store_event_id, tournament_id, user_id, role, status
                ) VALUES (
                  CAST(:id AS uuid),
                  CASE WHEN :eid IS NULL THEN NULL ELSE CAST(:eid AS uuid) END,
                  CAST(:tid AS uuid), :uid, :role, 'active'
                )
                ON CONFLICT (tournament_id, user_id) DO UPDATE
                  SET role = EXCLUDED.role, status = 'active'
                """
            ),
            {
                "id": sid,
                "eid": store_event_id,
                "tid": tournament_id,
                "uid": user_id,
                "role": role.value,
            },
        )
        await self.session.commit()
        return StaffAssignment(
            id=sid,
            user_id=user_id,
            role=role,
            tournament_id=tournament_id,
            store_event_id=store_event_id,
        )

    async def list_staff(self, tournament_id: str) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, user_id, role, status, store_event_id::text, tournament_id::text
                    FROM tcg_judge.tournament_staff
                    WHERE tournament_id = CAST(:tid AS uuid) AND status = 'active'
                    """
                ),
                {"tid": tournament_id},
            )
        ).mappings().all()
        return [dict(r) for r in rows]


class PenaltyService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def apply(
        self,
        *,
        tournament_id: str,
        participant_user_id: str,
        penalty_type: PenaltyType,
        judge_user_id: str,
        notes: str | None = None,
    ) -> PenaltyRecord:
        pid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.tournament_penalties (
                  id, tournament_id, participant_user_id, penalty_type, notes, judge_user_id
                ) VALUES (
                  CAST(:id AS uuid), CAST(:tid AS uuid), :puid, :ptype, :notes, :juid
                )
                """
            ),
            {
                "id": pid,
                "tid": tournament_id,
                "puid": participant_user_id,
                "ptype": penalty_type.value,
                "notes": notes,
                "juid": judge_user_id,
            },
        )
        await self.session.commit()
        emit(
            "penalty_applied",
            {"tournament_id": tournament_id, "type": penalty_type.value},
        )
        return PenaltyRecord(
            id=pid,
            tournament_id=tournament_id,
            participant_user_id=participant_user_id,
            penalty_type=penalty_type,
            judge_user_id=judge_user_id,
            notes=notes,
        )

    async def list_for_tournament(self, tournament_id: str) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, tournament_id::text, participant_user_id, penalty_type,
                           notes, judge_user_id, created_at::text
                    FROM tcg_judge.tournament_penalties
                    WHERE tournament_id = CAST(:tid AS uuid)
                    ORDER BY created_at DESC
                    """
                ),
                {"tid": tournament_id},
            )
        ).mappings().all()
        return [dict(r) for r in rows]


class PrizeService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def allocate(
        self,
        *,
        tournament_id: str,
        prize_type: PrizeType,
        rank_from: int = 1,
        rank_to: int = 1,
        amount_cents: int | None = None,
        points: int | None = None,
        description: str | None = None,
        product_ref: str | None = None,
        auto_distribute: bool = False,
    ) -> PrizeAllocation:
        pid = str(uuid.uuid4())
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.tournament_prize_allocations (
                  id, tournament_id, rank_from, rank_to, prize_type, amount_cents, points,
                  description, product_ref, auto_distribute
                ) VALUES (
                  CAST(:id AS uuid), CAST(:tid AS uuid), :rf, :rt, :ptype, :amt, :pts,
                  :desc, :pref, :auto
                )
                """
            ),
            {
                "id": pid,
                "tid": tournament_id,
                "rf": rank_from,
                "rt": rank_to,
                "ptype": prize_type.value,
                "amt": amount_cents,
                "pts": points,
                "desc": description,
                "pref": product_ref,
                "auto": auto_distribute,
            },
        )
        await self.session.commit()
        return PrizeAllocation(
            id=pid,
            tournament_id=tournament_id,
            prize_type=prize_type,
            rank_from=rank_from,
            rank_to=rank_to,
            amount_cents=amount_cents,
            points=points,
            description=description,
            product_ref=product_ref,
            auto_distribute=auto_distribute,
        )

    async def list_for_tournament(self, tournament_id: str) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, tournament_id::text, rank_from, rank_to, prize_type,
                           amount_cents, points, description, product_ref, auto_distribute
                    FROM tcg_judge.tournament_prize_allocations
                    WHERE tournament_id = CAST(:tid AS uuid)
                    ORDER BY rank_from
                    """
                ),
                {"tid": tournament_id},
            )
        ).mappings().all()
        return [dict(r) for r in rows]


class DecklistService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def archive(
        self,
        *,
        tournament_id: str,
        user_id: str,
        source: str = "upload",
        file_name: str | None = None,
        content: str | None = None,
    ) -> DecklistArchive:
        did = str(uuid.uuid4())
        content_hash = hashlib.sha256((content or file_name or did).encode()).hexdigest()[:32]
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.decklist_archives (
                  id, tournament_id, user_id, source, file_name, content_hash,
                  validation_status, meta
                ) VALUES (
                  CAST(:id AS uuid), CAST(:tid AS uuid), :uid, :source, :fn, :ch,
                  'pending', '{}'::jsonb
                )
                """
            ),
            {
                "id": did,
                "tid": tournament_id,
                "uid": user_id,
                "source": source,
                "fn": file_name,
                "ch": content_hash,
            },
        )
        await self.session.commit()
        return DecklistArchive(
            id=did,
            tournament_id=tournament_id,
            user_id=user_id,
            source=source,
            file_name=file_name,
            content_hash=content_hash,
            validation_status="pending",
        )


class PairingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def describe_formats(self) -> list[dict[str, Any]]:
        return [format_support(f) for f in PairingFormat]

    async def current(self, tournament_id: str) -> dict[str, Any]:
        return await get_pairings_for_current_round(self.session, tournament_id)

    def require_implemented(self, fmt: str) -> PairingFormat:
        return assert_format_or_raise(fmt)


class RoundService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def current_view(self, tournament_id: str) -> dict[str, Any]:
        t = await get_tournament_row(self.session, tournament_id)
        if not t:
            raise HTTPException(status_code=404, detail="tournament_not_found")
        return {
            "tournament_id": tournament_id,
            "current_round": t.get("current_round") or 0,
            "status": t.get("status"),
            "phase": t.get("phase"),
            "timer": "rc1_timer_ws",
            "extensions": "supported_via_rc1",
        }


class MatchService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_current(self, tournament_id: str) -> dict[str, Any]:
        pairings = await get_pairings_for_current_round(self.session, tournament_id)
        return {
            "tournament_id": tournament_id,
            "matches": pairings.get("pairings") or [],
            "fields": [
                "players",
                "table",
                "result",
                "game_wins",
                "draw",
                "penalties",
                "notes",
                "judge",
                "timestamp",
            ],
        }


class StandingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, tournament_id: str) -> list[dict[str, Any]]:
        return await get_standings(self.session, tournament_id)


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def event_dashboard(self, store_event_id: str) -> dict[str, Any]:
        from app.tournament_platform.services.core_services import (
            EventService,
            RegistrationService,
            TicketService,
            TournamentOrgService,
        )

        ev = await EventService(self.session).get(store_event_id)
        regs = await RegistrationService(self.session).list_for_event(store_event_id)
        tickets = await TicketService(self.session).list_for_event(store_event_id)
        tournaments = await TournamentOrgService(self.session).list_tournaments(store_event_id)
        checked = sum(1 for r in regs if r.get("status") in ("checked_in", "playing", "completed"))
        revenue = sum(
            int(t.get("price_cents") or 0)
            for t in tickets
            for _ in range(max(0, int(t.get("quantity") or 0) - int(t.get("availability") or 0)))
        )
        return {
            "event": ev.to_dict() if ev else None,
            "kpis": {
                "registered": len(regs),
                "checked_in": checked,
                "capacity": ev.capacity if ev else None,
                "tournaments": len(tournaments),
                "tickets": len(tickets),
                "revenue_cents_estimate": revenue,
                "judges": 0,
                "round": None,
                "tables": None,
            },
            "tournaments": tournaments,
        }

    async def player_dashboard(self, user_id: str, tournament_id: str) -> dict[str, Any]:
        from app.tournament_platform.services.core_services import RegistrationService

        reg = await RegistrationService(self.session).get_for_user_tournament(user_id, tournament_id)
        standings = await StandingService(self.session).get(tournament_id)
        pairing = await PairingService(self.session).current(tournament_id)
        my_rank = next((s for s in standings if s.get("user_id") == user_id), None)
        return {
            "registration": reg,
            "qr_code": (reg or {}).get("qr_code"),
            "standing": my_rank,
            "current_round": pairing.get("round"),
            "pairings": pairing.get("pairings"),
            "deck": None,
            "prize": None,
        }

    async def judge_dashboard(self, tournament_id: str) -> dict[str, Any]:
        staff = await JudgeService(self.session).list_staff(tournament_id)
        penalties = await PenaltyService(self.session).list_for_tournament(tournament_id)
        round_view = await RoundService(self.session).current_view(tournament_id)
        pairings = await PairingService(self.session).current(tournament_id)
        standings = await StandingService(self.session).get(tournament_id)
        return {
            "staff": staff,
            "penalties": penalties,
            "round": round_view,
            "pairings": pairings,
            "standings": standings[:16],
            "timer": "rc1",
        }

    async def store_dashboard(self, store_id: str) -> dict[str, Any]:
        from app.tournament_platform.services.core_services import EventService

        events = await EventService(self.session).list_for_store(store_id)
        tournaments = await list_tournaments_for_store(self.session, store_id)
        future = [e.to_dict() for e in events if e.status.value not in ("completed", "cancelled")]
        return {
            "upcoming_events": future,
            "tournaments": tournaments,
            "kpis": {
                "events": len(events),
                "active_tournaments": len(
                    [t for t in tournaments if t.get("status") not in ("finalized", "cancelled")]
                ),
                "revenue_cents": 0,
                "tickets_sold": 0,
                "checkins": 0,
                "no_shows": 0,
            },
        }
