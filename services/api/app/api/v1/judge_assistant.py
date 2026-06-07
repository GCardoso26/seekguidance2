"""Fase A — Judge Assistant: infrações, rulings, deck validator, métricas."""

from __future__ import annotations

from typing import Any

from app.judge.assistant_store import (
    classify_infraction,
    create_infraction,
    get_infraction,
    judge_metrics,
    list_infractions,
    update_infraction,
)
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["judge-assistant"])

# Rulings seed (Lorcana)
_LORCANA_RULINGS = [
    {
        "id": "seed-lorcana-0",
        "tcg": "lorcana",
        "title": "Bodyguard vs Evasive",
        "description": "Personagem com Bodyguard e Evasive exertado. Oponente sem Evasive tenta desafiar.",
        "question": "O oponente é obrigado a desafiar o Bodyguard mesmo sem ter Evasive?",
        "answer": (
            "Não. Evasive previne o desafio. Bodyguard diz 'se puder', "
            "e como Evasive impede o desafio, a condição não é satisfeita."
        ),
        "keywords_involved": ["bodyguard", "evasive"],
        "hierarchy": "official",
        "status": "approved",
        "language": "pt-BR",
    },
    {
        "id": "seed-lorcana-1",
        "tcg": "lorcana",
        "title": "Shift em personagem com dano",
        "description": "Jogador usa Shift para colocar personagem sobre outro com marcadores de dano.",
        "question": "O dano permanece após Shift?",
        "answer": (
            "Não. O personagem anterior deixa de existir; o novo entra sem marcadores "
            "de dano, salvo efeito que diga o contrário."
        ),
        "keywords_involved": ["shift", "damage"],
        "hierarchy": "official",
        "status": "approved",
        "language": "pt-BR",
    },
]


class InfractionCreateBody(BaseModel):
    match_id: str
    tournament_id: str | None = None
    reported_by: str
    reported_by_seat: int = Field(..., ge=1, le=2)
    target_player: str | None = None
    target_player_seat: int | None = Field(default=None, ge=1, le=2)
    type: str | None = None
    description: str = Field(..., min_length=3)
    log_sequences: list[int] = Field(default_factory=list)
    screenshots: list[str] = Field(default_factory=list)
    match_tcg: str = "lorcana"
    tournament_level: str = "regular"


class InfractionPatchBody(BaseModel):
    status: str | None = None
    assigned_judge: str | None = None
    resolution: dict[str, Any] | None = None
    appeal: dict[str, Any] | None = None


class DeckValidateBody(BaseModel):
    tcg: str
    format: str = "standard"
    name: str = "Deck"
    player_id: str = "anonymous"
    main_deck: list[dict[str, Any]]


class RulingSearchQuery(BaseModel):
    q: str = ""
    tcg: str | None = None
    limit: int = 20


def _require_user(x_judge_user_id: str | None) -> str:
    uid = (x_judge_user_id or "").strip()
    if not uid:
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    return uid


@router.post("/runtime/judge/infractions")
async def post_infraction(
    body: InfractionCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    report = create_infraction(
        {
            **body.model_dump(),
            "evidence": {
                "log_sequences": body.log_sequences,
                "screenshots": body.screenshots,
            },
        }
    )
    return {
        "id": report["id"],
        "status": report["status"],
        "sla_deadline": report["sla_deadline"],
        "assigned_judge": report.get("assigned_judge"),
        "classification_confidence": report.get("classification_confidence", 0),
        "report": report,
    }


@router.get("/runtime/judge/infractions")
async def get_infractions(
    status: str | None = None,
    assigned_to: str | None = None,
    tournament_id: str | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    _require_user(x_judge_user_id)
    return list_infractions(status=status, assigned_to=assigned_to, tournament_id=tournament_id)


@router.get("/runtime/judge/infractions/{infraction_id}")
async def get_infraction_by_id(
    infraction_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    report = get_infraction(infraction_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report não encontrado")
    return report


@router.patch("/runtime/judge/infractions/{infraction_id}")
async def patch_infraction(
    infraction_id: str,
    body: InfractionPatchBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    judge_id = _require_user(x_judge_user_id)
    patch = body.model_dump(exclude_none=True)
    if body.status == "investigating" and "first_response_at" not in patch:
        from datetime import UTC, datetime

        patch["first_response_at"] = datetime.now(UTC).isoformat()
        patch.setdefault("assigned_judge", judge_id)
    if body.status == "resolved":
        from datetime import UTC, datetime

        patch["resolved_at"] = datetime.now(UTC).isoformat()
    report = update_infraction(infraction_id, patch)
    if not report:
        raise HTTPException(status_code=404, detail="Report não encontrado")
    return report


@router.post("/runtime/judge/infractions/classify")
async def post_classify(body: dict[str, str]) -> dict[str, Any]:
    return classify_infraction(body.get("description", ""))


@router.get("/runtime/judge/rulings/search")
async def search_rulings(q: str = "", tcg: str | None = None, limit: int = 20) -> list[dict[str, Any]]:
    query = q.lower()
    results = []
    for r in _LORCANA_RULINGS:
        if tcg and r["tcg"] != tcg:
            continue
        hay = " ".join(
            [
                r.get("title", ""),
                r.get("description", ""),
                r.get("question", ""),
                r.get("answer", ""),
                " ".join(r.get("keywords_involved", [])),
            ]
        ).lower()
        if not query or query in hay:
            results.append(r)
    return results[:limit]


@router.get("/runtime/judge/rulings/suggest")
async def suggest_rulings(
    tcg: str = "lorcana",
    type: str = "",
    keywords: str = "",
) -> list[dict[str, Any]]:
    parts = [type, *(keywords.split(",") if keywords else [])]
    q = " ".join(p for p in parts if p)
    return await search_rulings(q=q, tcg=tcg, limit=10)


@router.post("/runtime/judge/deck-validator/validate")
async def validate_deck(body: DeckValidateBody) -> dict[str, Any]:
    from app.tcg_adapters.registry import SLUG_TO_GAME_CODE, get_adapter, normalize_game_code
    from app.tcg_adapters.types import DeckCard, ParsedDecklist

    tcg = body.tcg.strip().lower()
    game_code = SLUG_TO_GAME_CODE.get(tcg, tcg.upper())
    try:
        normalize_game_code(game_code)
        adapter = get_adapter(game_code)
        main = [
            DeckCard(
                definition_id=str(c.get("definition_id", c.get("name", ""))),
                name=str(c.get("name", c.get("definition_id", ""))),
                quantity=int(c.get("quantity", 1)),
                set_code=c.get("set_code"),
                collector_number=c.get("collector_number"),
                card_type=c.get("card_type"),
            )
            for c in body.main_deck
        ]
        deck = ParsedDecklist(
            tcg=tcg,
            format=(body.format or "standard").upper(),
            main_deck=main,
        )
        result = adapter.validate_decklist(deck)
        return {
            "valid": result.valid,
            "errors": [
                {
                    "code": e.code,
                    "message": e.message,
                    "severity": e.severity,
                    "cards_involved": e.cards_involved,
                    "rule_reference": e.rule_reference,
                }
                for e in result.errors
            ],
            "warnings": [
                {
                    "code": w.code,
                    "message": w.message,
                    "severity": w.severity,
                    "cards_involved": w.cards_involved,
                }
                for w in result.warnings
            ],
            "format_rules_applied": result.format_rules_applied,
            "banlist_version": result.banlist_version,
        }
    except KeyError:
        main = body.main_deck
        total = sum(int(c.get("quantity", 1)) for c in main)
        errors: list[dict[str, Any]] = []
        min_cards = 60 if body.tcg in ("lorcana", "pokemon", "mtg") else 50
        if total < min_cards:
            errors.append(
                {
                    "code": "DECK_TOO_SMALL",
                    "message": f"Deck tem {total} cartas. Mínimo: {min_cards}",
                    "severity": "error",
                }
            )
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": [],
            "format_rules_applied": f"{body.tcg}:{body.format}",
            "banlist_version": "2026-06-01",
        }


@router.get("/runtime/judge/metrics")
async def get_judge_dashboard_metrics(
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return judge_metrics()
