"""API do deckbuilder."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.decks import decks as decks_svc
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["decks"])


class DeckCreateBody(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    game: str = Field(min_length=1, max_length=50)
    format: str = Field(default="standard", max_length=50)
    format_id: str | None = None
    game_id: str | None = None
    is_public: bool = False


class DeckUpdateBody(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    format: str | None = Field(default=None, max_length=50)
    is_public: bool | None = None
    format_id: str | None = None


class DeckCardAddBody(BaseModel):
    card_id: str
    quantity: int = Field(default=1, ge=1, le=99)
    zone: str = Field(default="main", pattern="^(main|sideboard|commander|companion)$")
    is_foil: bool = False


class DeckCardUpdateBody(BaseModel):
    quantity: int = Field(ge=1, le=99)


class DeckValidateBody(BaseModel):
    owner_only: bool = True


@router.post("/runtime/judge/decks")
async def create_deck(
    session: DbSession,
    body: DeckCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    deck = await decks_svc.create_deck(
        session,
        user_id,
        name=body.name,
        game=body.game,
        format=body.format,
        game_id=body.game_id,
        format_id=body.format_id,
        description=body.description,
        is_public=body.is_public,
    )
    return {"deck": deck}


@router.get("/runtime/judge/decks")
async def list_my_decks(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    decks = await decks_svc.list_my_decks(session, user_id)
    return {"decks": decks}


@router.get("/runtime/judge/decks/public")
async def list_public_decks(
    session: DbSession,
    game: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
) -> dict[str, Any]:
    decks = await decks_svc.list_public_decks(session, game=game, limit=limit)
    return {"decks": decks}


@router.get("/runtime/judge/decks/{deck_id}")
async def get_deck(
    session: DbSession,
    deck_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    viewer = x_judge_user_id.strip() if x_judge_user_id else None
    deck = await decks_svc.get_deck(session, deck_id, viewer_id=viewer)
    return {"deck": deck}


@router.patch("/runtime/judge/decks/{deck_id}")
async def patch_deck(
    session: DbSession,
    deck_id: str,
    body: DeckUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    deck = await decks_svc.update_deck(
        session,
        user_id,
        deck_id,
        name=body.name,
        description=body.description,
        format=body.format,
        is_public=body.is_public,
    )
    return {"deck": deck}


@router.delete("/runtime/judge/decks/{deck_id}")
async def delete_deck(
    session: DbSession,
    deck_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await decks_svc.delete_deck(session, user_id, deck_id)


@router.post("/runtime/judge/decks/{deck_id}/cards")
async def add_card(
    session: DbSession,
    deck_id: str,
    body: DeckCardAddBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    deck = await decks_svc.add_card_to_deck(
        session,
        user_id,
        deck_id,
        card_id=body.card_id,
        quantity=body.quantity,
        zone=body.zone,
        is_foil=body.is_foil,
    )
    return {"deck": deck}


@router.patch("/runtime/judge/decks/{deck_id}/cards/{deck_card_id}")
async def patch_card(
    session: DbSession,
    deck_id: str,
    deck_card_id: str,
    body: DeckCardUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    deck = await decks_svc.update_deck_card_quantity(
        session,
        user_id,
        deck_id,
        deck_card_id,
        quantity=body.quantity,
    )
    return {"deck": deck}


@router.delete("/runtime/judge/decks/{deck_id}/cards/{deck_card_id}")
async def remove_card(
    session: DbSession,
    deck_id: str,
    deck_card_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    deck = await decks_svc.remove_card_from_deck(session, user_id, deck_id, deck_card_id)
    return {"deck": deck}


@router.post("/runtime/judge/decks/{deck_id}/publish")
async def publish_deck(
    session: DbSession,
    deck_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    deck = await decks_svc.publish_deck(session, user_id, deck_id)
    return {"deck": deck}


@router.get("/runtime/judge/decks/{deck_id}/export")
async def export_deck(
    session: DbSession,
    deck_id: str,
    format: str = Query(default="text", alias="format"),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    viewer = x_judge_user_id.strip() if x_judge_user_id else None
    if format not in {"text", "dec", "arena"}:
        raise HTTPException(400, "Formato de exportação inválido")
    return await decks_svc.export_deck(session, deck_id, export_format=format, viewer_id=viewer)


@router.get("/runtime/judge/formats/{game_slug}")
async def list_formats(session: DbSession, game_slug: str) -> dict[str, Any]:
    formats = await decks_svc.list_formats_by_game(session, game_slug)
    return {"formats": formats}


@router.get("/runtime/judge/formats/rules/{format_id}")
async def get_format_rules(session: DbSession, format_id: str) -> dict[str, Any]:
    data = await decks_svc.get_format_rules(session, format_id)
    if not data:
        raise HTTPException(404, "Formato não encontrado")
    return data


@router.get("/runtime/judge/decks/{deck_id}/validate")
async def validate_deck_get(
    session: DbSession,
    deck_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    result = await decks_svc.validate_deck(session, deck_id, owner_id=user_id)
    return {"validation": result}


@router.post("/runtime/judge/decks/{deck_id}/validate")
async def validate_deck_post(
    session: DbSession,
    deck_id: str,
    _body: DeckValidateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    result = await decks_svc.validate_deck(session, deck_id, owner_id=user_id)
    return {"validation": result}


@router.get("/runtime/judge/user/collection")
async def user_collection(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    items = await decks_svc.list_user_collection(session, user_id)
    return {"items": items}
