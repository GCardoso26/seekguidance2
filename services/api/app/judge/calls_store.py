"""Persistência SQL — chamadas de juiz, certificações e infrações."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

PRIORITY_ORDER = """
CASE priority
  WHEN 'urgent' THEN 4
  WHEN 'high' THEN 3
  WHEN 'medium' THEN 2
  ELSE 1
END DESC, created_at ASC
"""

_CALL_SELECT = """
SELECT
  c.*,
  t.name AS tournament_name,
  COALESCE(t.game_code, UPPER(t.tcg)) AS tournament_game_code,
  pp.handle AS caller_handle,
  tr.round_number
FROM tcg_judge.judge_calls c
LEFT JOIN tcg_judge.tournaments t ON t.id = c.tournament_id
LEFT JOIN tcg_judge.player_profiles pp ON pp.id = c.caller_id
LEFT JOIN tcg_judge.tournament_rounds tr ON tr.id = c.round_id
"""


def _row_to_call(row: Any) -> dict[str, Any]:
    d = dict(row)
    if d.get("evidence_urls") is None:
        d["evidence_urls"] = []
    return d


async def get_active_participant(
    session: AsyncSession,
    tournament_id: str,
    user_id: str,
) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT id, tournament_id, user_id, status
                FROM tcg_judge.tournament_participants
                WHERE tournament_id = CAST(:tid AS uuid)
                  AND user_id = :uid
                  AND status IN ('checked_in', 'active')
                """
            ),
            {"tid": tournament_id, "uid": user_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def create_call(session: AsyncSession, data: dict[str, Any]) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.judge_calls (
                  tournament_id, round_id, table_number,
                  caller_id, caller_participant_id,
                  type, priority, description, evidence_urls, status
                ) VALUES (
                  CAST(:tournament_id AS uuid),
                  CAST(:round_id AS uuid),
                  :table_number,
                  :caller_id,
                  CAST(:caller_participant_id AS uuid),
                  :type, :priority, :description, :evidence_urls, 'open'
                )
                RETURNING id
                """
            ),
            {
                "tournament_id": data["tournament_id"],
                "round_id": data.get("round_id"),
                "table_number": data["table_number"],
                "caller_id": data["caller_id"],
                "caller_participant_id": data["caller_participant_id"],
                "type": data["type"],
                "priority": data.get("priority", "medium"),
                "description": data["description"],
                "evidence_urls": data.get("evidence_urls") or [],
            },
        )
    ).first()
    call_id = str(row[0])
    call = await get_call(session, call_id)
    assert call is not None
    return call


async def get_call(session: AsyncSession, call_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(f"{_CALL_SELECT} WHERE c.id = CAST(:id AS uuid)"),
            {"id": call_id},
        )
    ).mappings().first()
    return _row_to_call(row) if row else None


async def list_calls(
    session: AsyncSession,
    *,
    tournament_id: str | None = None,
    status: str | None = None,
    caller_id: str | None = None,
    assigned_judge_id: str | None = None,
    organizer_id: str | None = None,
    open_for_judge: bool = False,
    judge_game_code: str | None = None,
) -> list[dict[str, Any]]:
    clauses = ["1=1"]
    params: dict[str, Any] = {}

    if tournament_id:
        clauses.append("c.tournament_id = CAST(:tournament_id AS uuid)")
        params["tournament_id"] = tournament_id
    if status:
        clauses.append("c.status = :status")
        params["status"] = status
    if caller_id:
        clauses.append("c.caller_id = :caller_id")
        params["caller_id"] = caller_id
    if assigned_judge_id:
        clauses.append("c.assigned_judge_id = :assigned_judge_id")
        params["assigned_judge_id"] = assigned_judge_id
    if organizer_id and tournament_id:
        clauses.append(
            """
            EXISTS (
              SELECT 1 FROM tcg_judge.tournaments t
              WHERE t.id = c.tournament_id AND t.created_by = :organizer_id
            )
            """
        )
        params["organizer_id"] = organizer_id
    if open_for_judge and judge_game_code:
        clauses.append("c.status = 'open'")
        clauses.append("UPPER(COALESCE(t.game_code, t.tcg)) = :game_code")
        params["game_code"] = judge_game_code.upper()

    where = " AND ".join(clauses)
    rows = (
        await session.execute(
            text(f"{_CALL_SELECT} WHERE {where} ORDER BY {PRIORITY_ORDER}"),
            params,
        )
    ).mappings().all()
    return [_row_to_call(r) for r in rows]


async def accept_call(
    session: AsyncSession,
    call_id: str,
    judge_id: str,
) -> dict[str, Any] | None:
    now = datetime.now(UTC)
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.judge_calls
                SET assigned_judge_id = :jid,
                    status = 'assigned',
                    assigned_at = :now
                WHERE id = CAST(:id AS uuid)
                  AND status = 'open'
                RETURNING id
                """
            ),
            {"id": call_id, "jid": judge_id, "now": now},
        )
    ).first()
    if not row:
        return None
    return await get_call(session, call_id)


async def resolve_call(
    session: AsyncSession,
    call_id: str,
    judge_id: str,
    *,
    ruling: str,
    ruling_category: str,
    infracting_player_id: str | None = None,
    infraction_type: str | None = None,
    severity: str | None = None,
    tournament_id: str | None = None,
    game_code: str | None = None,
) -> dict[str, Any] | None:
    now = datetime.now(UTC)
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.judge_calls
                SET ruling = :ruling,
                    ruling_category = :rcat,
                    ruling_judge_id = :jid,
                    status = 'resolved',
                    resolved_at = :now
                WHERE id = CAST(:id AS uuid)
                  AND assigned_judge_id = :jid
                  AND status = 'assigned'
                RETURNING tournament_id
                """
            ),
            {
                "id": call_id,
                "jid": judge_id,
                "ruling": ruling,
                "rcat": ruling_category,
                "now": now,
            },
        )
    ).first()
    if not row:
        return None

    penalty_categories = {"warning", "game_loss", "match_loss", "disqualification"}
    if ruling_category in penalty_categories and infracting_player_id and infraction_type:
        tid = tournament_id or str(row[0])
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.call_infractions (
                  call_id, player_id, tournament_id,
                  type, severity, penalty, description, judge_id
                ) VALUES (
                  CAST(:call_id AS uuid),
                  :player_id,
                  CAST(:tournament_id AS uuid),
                  :itype, :severity, :penalty, :description, :judge_id
                )
                """
            ),
            {
                "call_id": call_id,
                "player_id": infracting_player_id,
                "tournament_id": tid,
                "itype": infraction_type,
                "severity": severity or "minor",
                "penalty": ruling_category,
                "description": ruling,
                "judge_id": judge_id,
            },
        )
        if game_code:
            from app.judge.fair_play import update_fair_play_score

            await update_fair_play_score(
                session,
                infracting_player_id,
                game_code,
                penalty=ruling_category,
            )

    return await get_call(session, call_id)


async def escalate_call(
    session: AsyncSession,
    call_id: str,
    judge_id: str,
    *,
    escalated_to: str,
    reason: str,
) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.judge_calls
                SET status = 'escalated',
                    escalated_to = :eto,
                    escalation_reason = :reason
                WHERE id = CAST(:id AS uuid)
                  AND assigned_judge_id = :jid
                RETURNING id
                """
            ),
            {"id": call_id, "jid": judge_id, "eto": escalated_to, "reason": reason},
        )
    ).first()
    if not row:
        return None
    return await get_call(session, call_id)


async def get_tournament_organizer(session: AsyncSession, tournament_id: str) -> str | None:
    row = (
        await session.execute(
            text("SELECT created_by FROM tcg_judge.tournaments WHERE id = CAST(:id AS uuid)"),
            {"id": tournament_id},
        )
    ).first()
    return str(row[0]) if row and row[0] else None


async def get_tournament_game_code(session: AsyncSession, tournament_id: str) -> str | None:
    row = (
        await session.execute(
            text(
                """
                SELECT COALESCE(game_code, UPPER(tcg)) AS gc
                FROM tcg_judge.tournaments WHERE id = CAST(:id AS uuid)
                """
            ),
            {"id": tournament_id},
        )
    ).first()
    return str(row[0]).upper() if row and row[0] else None


async def get_active_certification(
    session: AsyncSession,
    player_id: str,
    game_code: str | None = None,
) -> dict[str, Any] | None:
    clauses = ["player_id = :pid", "status = 'active'"]
    params: dict[str, Any] = {"pid": player_id}
    if game_code:
        clauses.append("UPPER(game_code) = :gc")
        params["gc"] = game_code.upper()
    row = (
        await session.execute(
            text(
                f"""
                SELECT * FROM tcg_judge.judge_certifications
                WHERE {' AND '.join(clauses)}
                ORDER BY certified_at DESC
                LIMIT 1
                """
            ),
            params,
        )
    ).mappings().first()
    return dict(row) if row else None


async def list_certifications(session: AsyncSession, player_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.judge_certifications
                WHERE player_id = :pid AND status = 'active'
                ORDER BY game_code
                """
            ),
            {"pid": player_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def list_certified_judges_for_game(
    session: AsyncSession,
    game_code: str,
) -> list[str]:
    rows = (
        await session.execute(
            text(
                """
                SELECT player_id FROM tcg_judge.judge_certifications
                WHERE UPPER(game_code) = :gc AND status = 'active'
                """
            ),
            {"gc": game_code.upper()},
        )
    ).all()
    return [str(r[0]) for r in rows]
