"""API multi-TCG — jogos, formatos, decklists, torneios."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.api.deps import DbSession
from app.tcg_adapters.registry import GAME_CODE_TO_SLUG, get_adapter, list_tournament_games, normalize_game_code
from app.tcg_adapters.types import ParsedDecklist
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text

router = APIRouter(tags=["tournament-system"])


class DeckParseBody(BaseModel):
    raw: str
    format: str = "STANDARD"


class DeckValidateBody(BaseModel):
    format: str = "STANDARD"
    raw: str | None = None
    main_deck: list[dict[str, Any]] | None = None
    sideboard: list[dict[str, Any]] | None = None
    commander: dict[str, Any] | None = None


class TournamentCreateBody(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    game_code: str
    format_code: str
    level: str = "regular"
    match_type: str | None = None
    timer_minutes: int | None = None
    top_cut: int | None = None
    swiss_rounds: str | None = None
    decklist_required: bool | None = None
    max_players: int = 128
    starts_at: datetime | None = None


from app.api.judge_user import require_judge_user as _require_user


def _issue_to_dict(issue: Any) -> dict[str, Any]:
    return {
        "code": issue.code,
        "message": issue.message,
        "severity": issue.severity,
        "cards_involved": issue.cards_involved,
        "rule_reference": issue.rule_reference,
    }


def _result_to_dict(result: Any) -> dict[str, Any]:
    return {
        "valid": result.valid,
        "errors": [_issue_to_dict(e) for e in result.errors],
        "warnings": [_issue_to_dict(w) for w in result.warnings],
        "format_rules_applied": result.format_rules_applied,
        "banlist_version": result.banlist_version,
    }


def _deck_to_dict(deck: ParsedDecklist) -> dict[str, Any]:
    def cards(cs: list) -> list[dict[str, Any]]:
        return [
            {
                "definition_id": c.definition_id,
                "name": c.name,
                "quantity": c.quantity,
                "set_code": c.set_code,
                "collector_number": c.collector_number,
                "card_type": c.card_type,
            }
            for c in cs
        ]

    out: dict[str, Any] = {
        "tcg": deck.tcg,
        "format": deck.format,
        "main_deck": cards(deck.main_deck),
        "sideboard": cards(deck.sideboard),
    }
    if deck.commander:
        out["commander"] = {
            "definition_id": deck.commander.definition_id,
            "name": deck.commander.name,
            "quantity": deck.commander.quantity,
        }
    return out


def _body_to_parsed(body: DeckValidateBody, adapter_code: str) -> ParsedDecklist:
    slug = GAME_CODE_TO_SLUG.get(normalize_game_code(adapter_code), adapter_code.lower())
    if body.raw:
        return get_adapter(adapter_code).parse_decklist(body.raw, body.format)
    from app.tcg_adapters.types import DeckCard

    def parse_cards(items: list[dict[str, Any]] | None) -> list[DeckCard]:
        if not items:
            return []
        return [
            DeckCard(
                definition_id=str(c.get("definition_id", c.get("name", ""))),
                name=str(c.get("name", c.get("definition_id", ""))),
                quantity=int(c.get("quantity", 1)),
                set_code=c.get("set_code"),
                collector_number=c.get("collector_number"),
                card_type=c.get("card_type"),
            )
            for c in items
        ]

    commander = None
    if body.commander:
        commander = DeckCard(
            definition_id=str(body.commander.get("definition_id", "")),
            name=str(body.commander.get("name", "")),
            quantity=int(body.commander.get("quantity", 1)),
        )

    return ParsedDecklist(
        tcg=slug,
        format=body.format,
        main_deck=parse_cards(body.main_deck),
        sideboard=parse_cards(body.sideboard),
        commander=commander,
    )


@router.get("/runtime/judge/tournament/games")
async def list_games() -> list[dict[str, str]]:
    return list_tournament_games()


@router.get("/runtime/judge/tournament/games/{code}/formats")
async def list_formats(code: str, session: DbSession) -> list[dict[str, Any]]:
    game_code = normalize_game_code(code)
    adapter = get_adapter(game_code)

    rows = (
        await session.execute(
            text(
                """
                SELECT code, name, description, decklist_required, decklist_validation,
                       default_timer_minutes, default_match_type, default_swiss_rounds,
                       default_top_cut, min_players, max_players
                FROM tcg_judge.game_formats
                WHERE game_code = :game_code AND active = true
                ORDER BY name
                """
            ),
            {"game_code": game_code},
        )
    ).mappings().all()

    if rows:
        return [dict(r) for r in rows]

    return [
        {
            "code": f.code,
            "name": f.name,
            "description": f.description,
            "decklist_required": f.decklist_required,
            "decklist_validation": f.decklist_validation,
            "default_timer_minutes": f.default_timer_minutes,
            "default_match_type": f.default_match_type,
            "default_swiss_rounds": f.default_swiss_rounds,
            "default_top_cut": f.default_top_cut,
            "min_players": f.min_players,
            "max_players": f.max_players,
        }
        for f in adapter.supported_formats()
    ]


@router.get("/runtime/judge/tournament/games/{code}/cards/search")
async def search_cards(
    code: str,
    session: DbSession,
    q: str = Query("", min_length=0),
    limit: int = Query(20, ge=1, le=50),
) -> list[dict[str, Any]]:
    game_code = normalize_game_code(code)
    adapter = get_adapter(game_code)
    results: list[dict[str, Any]] = []

    if q.strip():
        db_rows = (
            await session.execute(
                text(
                    """
                    SELECT external_id, name, normalized_name, set_code, set_name,
                           card_number, rarity, card_type, game_specific_type,
                           legality, image_url, game_data
                    FROM tcg_judge.card_catalog
                    WHERE game_code = :game_code
                      AND normalized_name ILIKE :pattern
                    ORDER BY name
                    LIMIT :lim
                    """
                ),
                {"game_code": game_code, "pattern": f"%{q.strip().lower()}%", "lim": limit},
            )
        ).mappings().all()

        for row in db_rows:
            results.append(
                {
                    "id": row["external_id"],
                    "game": game_code,
                    "externalId": row["external_id"],
                    "name": row["name"],
                    "normalizedName": row["normalized_name"],
                    "setCode": row["set_code"],
                    "setName": row["set_name"],
                    "number": row["card_number"],
                    "rarity": row["rarity"],
                    "type": row["card_type"],
                    "gameSpecificType": row["game_specific_type"],
                    "legality": row["legality"] or {},
                    "imageUrl": row["image_url"],
                    **(row["game_data"] or {}),
                }
            )

    if len(results) < limit:
        seen = {r["id"] for r in results}
        for card in adapter.search_cards(q, limit=limit):
            if card.external_id not in seen:
                results.append(
                    {
                        "id": card.external_id,
                        "game": card.game,
                        "externalId": card.external_id,
                        "name": card.name,
                        "normalizedName": card.normalized_name,
                        "setCode": card.set_code,
                        "type": card.card_type,
                        "legality": card.legality,
                        "imageUrl": card.image_url,
                        **card.game_data,
                    }
                )
                if len(results) >= limit:
                    break

    return results[:limit]


@router.post("/runtime/judge/tournament/games/{code}/decklist/parse")
async def parse_decklist(code: str, body: DeckParseBody) -> dict[str, Any]:
    adapter = get_adapter(code)
    deck = adapter.parse_decklist(body.raw, body.format)
    return _deck_to_dict(deck)


@router.post("/runtime/judge/tournament/games/{code}/decklist/validate")
async def validate_decklist(code: str, body: DeckValidateBody) -> dict[str, Any]:
    adapter = get_adapter(code)
    deck = _body_to_parsed(body, code)
    result = adapter.validate_decklist(deck)
    return _result_to_dict(result)


@router.get("/runtime/judge/tournament/games/{code}/banlist")
async def get_banlist(code: str, format: str = Query("STANDARD")) -> dict[str, Any]:
    adapter = get_adapter(code)
    banlist = adapter.get_banlist(format)
    return {"game": normalize_game_code(code), "format": format.upper(), "cards": banlist, "version": "2026-06-01"}


@router.get("/runtime/judge/tournaments")
async def list_tournaments(
    session: DbSession,
    game: str | None = None,
    status: str | None = None,
    limit: int = Query(50, ge=1, le=100),
) -> list[dict[str, Any]]:
    clauses = ["1=1"]
    params: dict[str, Any] = {"lim": limit}
    if game:
        clauses.append("(game_code = :game OR tcg = :slug)")
        params["game"] = game.upper()
        params["slug"] = GAME_CODE_TO_SLUG.get(game.upper(), game.lower())
    if status:
        clauses.append("status = :status")
        params["status"] = status

    rows = (
        await session.execute(
            text(
                f"""
                SELECT id, name, tcg, game_code, format, format_code, level, status,
                       match_type, timer_minutes, top_cut, swiss_rounds,
                       decklist_required, max_players, starts_at, created_at
                FROM tcg_judge.tournaments
                WHERE {' AND '.join(clauses)}
                ORDER BY created_at DESC
                LIMIT :lim
                """
            ),
            params,
        )
    ).mappings().all()
    return [dict(r) for r in rows]


@router.post("/runtime/judge/tournaments")
async def create_tournament(
    body: TournamentCreateBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    game_code = normalize_game_code(body.game_code)
    slug = GAME_CODE_TO_SLUG[game_code]
    adapter = get_adapter(game_code)

    fmt_row = (
        await session.execute(
            text(
                """
                SELECT code, name, default_timer_minutes, default_match_type,
                       default_swiss_rounds, default_top_cut, decklist_required
                FROM tcg_judge.game_formats
                WHERE game_code = :game_code AND code = :format_code AND active = true
                """
            ),
            {"game_code": game_code, "format_code": body.format_code.upper()},
        )
    ).mappings().first()

    if fmt_row:
        defaults = dict(fmt_row)
    else:
        supported = {f.code: f for f in adapter.supported_formats()}
        fmt = supported.get(body.format_code.upper())
        if not fmt:
            raise HTTPException(status_code=400, detail=f"Formato inválido: {body.format_code}")
        defaults = {
            "code": fmt.code,
            "name": fmt.name,
            "default_timer_minutes": fmt.default_timer_minutes,
            "default_match_type": fmt.default_match_type,
            "default_swiss_rounds": fmt.default_swiss_rounds,
            "default_top_cut": fmt.default_top_cut,
            "decklist_required": fmt.decklist_required,
        }

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.tournaments (
                  name, tcg, game_code, format, format_code, level, status,
                  created_by, match_type, timer_minutes, top_cut, swiss_rounds,
                  decklist_required, max_players, starts_at
                ) VALUES (
                  :name, :tcg, :game_code, :format, :format_code, :level, 'draft',
                  :created_by, :match_type, :timer_minutes, :top_cut, :swiss_rounds,
                  :decklist_required, :max_players, :starts_at
                )
                RETURNING id, name, tcg, game_code, format_code, status, created_at
                """
            ),
            {
                "name": body.name,
                "tcg": slug,
                "game_code": game_code,
                "format": defaults["code"].lower(),
                "format_code": defaults["code"],
                "level": body.level,
                "created_by": user_id,
                "match_type": body.match_type or defaults["default_match_type"],
                "timer_minutes": body.timer_minutes or defaults["default_timer_minutes"],
                "top_cut": body.top_cut if body.top_cut is not None else defaults.get("default_top_cut"),
                "swiss_rounds": body.swiss_rounds or defaults["default_swiss_rounds"],
                "decklist_required": (
                    body.decklist_required
                    if body.decklist_required is not None
                    else defaults["decklist_required"]
                ),
                "max_players": body.max_players,
                "starts_at": body.starts_at,
            },
        )
    ).mappings().first()
    await session.commit()

    if not row:
        raise HTTPException(status_code=500, detail="Falha ao criar torneio")
    return dict(row)
