"""API de overlay para OBS/streaming."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from app.api.deps import DbSession
from app.overlay.service import build_overlay_payload
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter(tags=["overlay"])

_TEMPLATES = Path(__file__).resolve().parents[2] / "overlay" / "templates"


@router.get("/overlay/{tournament_id}/standings")
async def overlay_standings(session: DbSession, tournament_id: str) -> dict:
    payload = await build_overlay_payload(session, tournament_id)
    return JSONResponse(payload)


@router.get("/overlay/{tournament_id}/pairings")
async def overlay_pairings(session: DbSession, tournament_id: str) -> dict:
    payload = await build_overlay_payload(session, tournament_id)
    return JSONResponse({"tournament": payload.get("tournament"), "topPairing": payload.get("topPairing")})


@router.get("/overlay/{tournament_id}/timer")
async def overlay_timer(session: DbSession, tournament_id: str) -> dict:
    payload = await build_overlay_payload(session, tournament_id)
    return JSONResponse({"tournament": payload.get("tournament")})


@router.get("/overlay/{tournament_id}/bracket")
async def overlay_bracket(session: DbSession, tournament_id: str) -> dict:
    payload = await build_overlay_payload(session, tournament_id)
    return JSONResponse({"tournament": payload.get("tournament"), "standings": payload.get("standings", [])[:4]})


@router.get("/overlay/templates/{name}.html")
async def overlay_template(name: str) -> FileResponse:
    path = _TEMPLATES / f"{name}.html"
    if not path.exists():
        path = _TEMPLATES / "standings.html"
    return FileResponse(path, media_type="text/html")


@router.websocket("/overlay/ws/{tournament_id}")
async def overlay_websocket(websocket: WebSocket, tournament_id: str) -> None:
    await websocket.accept()
    from app.infrastructure.db.session import get_session_factory

    try:
        while True:
            async with get_session_factory()() as session:
                payload = await build_overlay_payload(session, tournament_id)
            await websocket.send_json(payload)
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        pass
