"""Pairings / standings dual-read over RC1 tournament engine."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.tournament_platform.domain.enums import (
    IMPLEMENTED_PAIRING_FORMATS,
    PREPARED_PAIRING_FORMATS,
    PairingFormat,
)


def format_support(fmt: PairingFormat | str) -> dict[str, Any]:
    try:
        pf = PairingFormat(str(fmt))
    except ValueError:
        return {"format": str(fmt), "status": "unknown", "implemented": False}
    if pf in IMPLEMENTED_PAIRING_FORMATS:
        return {"format": pf.value, "status": "implemented", "implemented": True, "via": "rc1_engine"}
    if pf in PREPARED_PAIRING_FORMATS:
        return {
            "format": pf.value,
            "status": "prepared",
            "implemented": False,
            "via": "architecture_stub",
        }
    return {"format": pf.value, "status": "unknown", "implemented": False}


async def get_standings(session: AsyncSession, tournament_id: str) -> list[dict[str, Any]]:
    try:
        from app.tournament import flow

        rows = await flow.get_standings(session, tournament_id)
        return rows if isinstance(rows, list) else []
    except Exception:
        from app.tournament_platform.adapters.rc1_tournament import list_participants_projection

        parts = await list_participants_projection(session, tournament_id)
        return [
            {
                "rank": i + 1,
                "user_id": p.get("user_id"),
                "display_name": p.get("display_name"),
                "match_points": p.get("match_points", 0),
                "omw_percent": float(p.get("omw_percent") or 0),
                "gw_percent": float(p.get("gw_percent") or 0),
                "ogw_percent": float(p.get("ogw_percent") or 0),
                "status": p.get("status"),
            }
            for i, p in enumerate(parts)
        ]


async def get_pairings_for_current_round(
    session: AsyncSession, tournament_id: str
) -> dict[str, Any]:
    from app.tournament_platform.adapters.rc1_tournament import get_tournament_row

    t = await get_tournament_row(session, tournament_id)
    if not t:
        return {"tournament_id": tournament_id, "pairings": [], "round": None}
    round_no = t.get("current_round") or 0
    try:
        from app.tournament.store import list_pairings_for_round

        pairings: list[dict[str, Any]] = []
        try:
            from sqlalchemy import text

            row = (
                await session.execute(
                    text(
                        """
                        SELECT id::text AS id FROM tcg_judge.tournament_rounds
                        WHERE tournament_id = CAST(:tid AS uuid)
                          AND round_number = :rn
                        LIMIT 1
                        """
                    ),
                    {"tid": tournament_id, "rn": round_no},
                )
            ).mappings().first()
            if row:
                pairings = await list_pairings_for_round(session, row["id"])
        except Exception:
            pairings = []
        return {
            "tournament_id": tournament_id,
            "round": round_no,
            "pairings": pairings,
            "format_support": format_support(PairingFormat.SWISS),
        }
    except Exception:
        return {
            "tournament_id": tournament_id,
            "round": round_no,
            "pairings": [],
            "format_support": format_support(PairingFormat.SWISS),
        }


def assert_format_or_raise(fmt: PairingFormat | str) -> PairingFormat:
    info = format_support(fmt)
    if not info["implemented"]:
        raise NotImplementedError(
            f"Pairing format {info['format']} is prepared but not implemented in RC1 engine yet"
        )
    return PairingFormat(info["format"])
