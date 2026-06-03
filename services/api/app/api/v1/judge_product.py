"""Wave 2B — sessões cloud, partilha de vereditos, métricas de crescimento."""

from __future__ import annotations

import json
from typing import Any

import structlog
from app.api.deps import DbSession
from app.core.config import get_settings
from app.judge.analytics_events import monetization_metrics_payload, record_analytics_events
from app.judge.growth_metrics import GROWTH_EVENT_TYPES, growth_dashboard_payload, record_growth_metric
from app.judge.share_signing import is_valid_uuid, sign_share_id, verify_share_signature
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["judge-product"])
settings = get_settings()


class JudgeSessionMessageIn(BaseModel):
    role: str = Field(..., examples=["user", "assistant"])
    content: str
    payload: dict[str, Any] = Field(default_factory=dict)


class JudgeSessionCreateBody(BaseModel):
    tcg: str
    title: str | None = None
    allow_anonymous_read: bool = False
    messages: list[JudgeSessionMessageIn] = Field(default_factory=list)


class JudgeSessionResponse(BaseModel):
    id: str
    tcg: str
    title: str | None
    allow_anonymous_read: bool
    messages: list[dict[str, Any]]
    created_at: str | None = None
    updated_at: str | None = None


class JudgeShareCreateBody(BaseModel):
    tcg: str
    question: str = Field(..., min_length=1, max_length=4000)
    response: dict[str, Any]


class JudgeShareResponse(BaseModel):
    id: str
    tcg: str
    question: str
    response: dict[str, Any]
    signature: str | None = None


class JudgeGrowthEventBody(BaseModel):
    metric_type: str
    game: str | None = None
    metric_value: float | None = None
    details: dict[str, Any] = Field(default_factory=dict)


def _require_user_id(x_judge_user_id: str | None) -> str:
    uid = (x_judge_user_id or "").strip()
    if not uid:
        raise HTTPException(status_code=401, detail="Autenticação necessária (X-Judge-User-Id)")
    return uid


@router.post("/runtime/judge/session", response_model=JudgeSessionResponse)
async def create_judge_session(
    body: JudgeSessionCreateBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> JudgeSessionResponse:
    user_id = _require_user_id(x_judge_user_id)
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.judge_sessions
                  (auth_user_id, tcg, title, allow_anonymous_read)
                VALUES (:auth_user_id, :tcg, :title, :allow_anonymous_read)
                RETURNING id, tcg, title, allow_anonymous_read, created_at, updated_at
                """
            ),
            {
                "auth_user_id": user_id,
                "tcg": body.tcg.strip().lower(),
                "title": body.title,
                "allow_anonymous_read": body.allow_anonymous_read,
            },
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=500, detail="Falha ao criar sessão")
    session_id = str(row["id"])
    messages_out: list[dict[str, Any]] = []
    for msg in body.messages:
        mrow = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.judge_session_messages
                      (session_id, role, content, payload)
                    VALUES (:session_id, :role, :content, CAST(:payload AS jsonb))
                    RETURNING id, role, content, payload, created_at
                    """
                ),
                {
                    "session_id": session_id,
                    "role": msg.role,
                    "content": msg.content,
                    "payload": json.dumps(msg.payload),
                },
            )
        ).mappings().first()
        if mrow:
            messages_out.append(_message_dict(mrow))
    await session.commit()
    return JudgeSessionResponse(
        id=session_id,
        tcg=str(row["tcg"]),
        title=row.get("title"),
        allow_anonymous_read=bool(row["allow_anonymous_read"]),
        messages=messages_out,
        created_at=_iso(row.get("created_at")),
        updated_at=_iso(row.get("updated_at")),
    )


@router.get("/runtime/judge/session/{session_id}", response_model=JudgeSessionResponse)
async def get_judge_session(
    session_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> JudgeSessionResponse:
    if not is_valid_uuid(session_id):
        raise HTTPException(status_code=400, detail="ID de sessão inválido")
    user_id = (x_judge_user_id or "").strip() or None
    srow = (
        await session.execute(
            text(
                """
                SELECT id, auth_user_id, tcg, title, allow_anonymous_read, created_at, updated_at
                FROM tcg_judge.judge_sessions
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"id": session_id},
        )
    ).mappings().first()
    if not srow:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    owner = str(srow["auth_user_id"])
    allow_public = bool(srow["allow_anonymous_read"])
    if owner != user_id and not allow_public:
        raise HTTPException(status_code=403, detail="Sessão privada")
    msgs = (
        await session.execute(
            text(
                """
                SELECT id, role, content, payload, created_at
                FROM tcg_judge.judge_session_messages
                WHERE session_id = CAST(:id AS uuid)
                ORDER BY created_at ASC
                """
            ),
            {"id": session_id},
        )
    ).mappings().all()
    if user_id and owner == user_id:
        await record_growth_metric(session, "session_restored", game=str(srow["tcg"]))
    return JudgeSessionResponse(
        id=str(srow["id"]),
        tcg=str(srow["tcg"]),
        title=srow.get("title"),
        allow_anonymous_read=allow_public,
        messages=[_message_dict(m) for m in msgs],
        created_at=_iso(srow.get("created_at")),
        updated_at=_iso(srow.get("updated_at")),
    )


@router.post("/runtime/judge/share", response_model=JudgeShareResponse)
async def create_judge_share(body: JudgeShareCreateBody, session: DbSession) -> JudgeShareResponse:
    try:
        row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.judge_shared_verdicts (tcg, question, response, is_public)
                    VALUES (:tcg, :question, CAST(:response AS jsonb), true)
                    RETURNING id, tcg, question, response
                    """
                ),
                {
                    "tcg": body.tcg.strip().lower(),
                    "question": body.question.strip(),
                    "response": json.dumps(body.response),
                },
            )
        ).mappings().first()
        await session.commit()
    except Exception:
        logger.warning("judge_share_create_failed", exc_info=True)
        raise HTTPException(status_code=503, detail="Partilha indisponível") from None
    if not row:
        raise HTTPException(status_code=500, detail="Falha ao criar partilha")
    share_id = str(row["id"])
    sig = sign_share_id(share_id, settings.judge_share_secret)
    await record_growth_metric(
        session,
        "share_created",
        game=str(row["tcg"]),
        details={"share_id": share_id},
    )
    return JudgeShareResponse(
        id=share_id,
        tcg=str(row["tcg"]),
        question=str(row["question"]),
        response=dict(row["response"]) if isinstance(row["response"], dict) else json.loads(row["response"]),
        signature=sig,
    )


@router.get("/runtime/judge/share/{share_id}", response_model=JudgeShareResponse)
async def get_judge_share(
    share_id: str,
    session: DbSession,
    sig: str | None = None,
) -> JudgeShareResponse:
    if not is_valid_uuid(share_id):
        raise HTTPException(status_code=400, detail="ID inválido")
    secret = settings.judge_share_secret
    if secret and not verify_share_signature(
        share_id, sig, secret, previous_secret=settings.judge_share_secret_previous
    ):
        raise HTTPException(status_code=403, detail="Assinatura inválida")
    row = (
        await session.execute(
            text(
                """
                SELECT id, tcg, question, response, is_public
                FROM tcg_judge.judge_shared_verdicts
                WHERE id = CAST(:id AS uuid) AND is_public = true
                """
            ),
            {"id": share_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Veredito não encontrado")
    await record_growth_metric(
        session,
        "share_opened",
        game=str(row["tcg"]),
        details={"share_id": share_id},
    )
    resp = row["response"]
    if not isinstance(resp, dict):
        resp = json.loads(resp) if resp else {}
    return JudgeShareResponse(
        id=str(row["id"]),
        tcg=str(row["tcg"]),
        question=str(row["question"]),
        response=resp,
        signature=sign_share_id(share_id, secret),
    )


@router.post("/runtime/judge/growth/event", status_code=202)
async def post_growth_event(body: JudgeGrowthEventBody, session: DbSession) -> dict[str, str]:
    if body.metric_type not in GROWTH_EVENT_TYPES:
        raise HTTPException(status_code=400, detail="metric_type inválido")
    await record_growth_metric(
        session,
        body.metric_type,
        game=body.game,
        metric_value=body.metric_value,
        details=body.details,
    )
    return {"status": "accepted"}


@router.get("/runtime/judge/growth")
async def get_judge_growth(session: DbSession, days: int = 30) -> dict[str, Any]:
    return await growth_dashboard_payload(session, days=days)


class AnalyticsEventBody(BaseModel):
    event: str
    timestamp: str
    user_id: str | None = None
    anonymous_id: str | None = None
    properties: dict[str, Any] | None = None
    tier: str | None = "free"
    game_slug: str | None = None


class TrackAnalyticsBody(BaseModel):
    events: list[AnalyticsEventBody] = Field(default_factory=list)


@router.post("/runtime/judge/analytics/track", status_code=202)
async def track_analytics_events(body: TrackAnalyticsBody, session: DbSession) -> dict[str, int]:
    received = await record_analytics_events(
        session,
        [e.model_dump() for e in body.events],
    )
    return {"received": received}


@router.get("/runtime/judge/analytics/metrics")
async def get_analytics_metrics(session: DbSession, days: int = 30) -> dict[str, Any]:
    return await monetization_metrics_payload(session, days=days)


class HistoryMigrateEntry(BaseModel):
    tcg: str
    question: str
    answer: str = ""
    success: bool = True
    confidence: float = 0.0
    createdAt: str | None = None
    sources: list[dict[str, Any]] = Field(default_factory=list)
    verdict: str | None = None
    rule_applied: str | None = None


class HistoryMigrateBody(BaseModel):
    entries: list[HistoryMigrateEntry] = Field(default_factory=list)


@router.post("/runtime/judge/history/migrate", status_code=202)
async def migrate_judge_history(
    body: HistoryMigrateBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    """Migra histórico localStorage → sessões cloud (idempotente por título+pergunta)."""
    user_id = _require_user_id(x_judge_user_id)
    if len(body.entries) > 50:
        raise HTTPException(status_code=400, detail="Máximo de 50 entradas por migração.")
    migrated = 0
    for entry in body.entries:
        tcg = entry.tcg.strip().lower()
        try:
            row = (
                await session.execute(
                    text(
                        """
                        INSERT INTO tcg_judge.judge_sessions (auth_user_id, tcg, title)
                        VALUES (:uid, :tcg, :title)
                        RETURNING id
                        """
                    ),
                    {
                        "uid": user_id,
                        "tcg": tcg,
                        "title": entry.question[:80],
                    },
                )
            ).mappings().first()
            if not row:
                continue
            sid = str(row["id"])
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.judge_session_messages
                      (session_id, role, content, payload)
                    VALUES
                      (:sid, 'user', :q, CAST(:up AS jsonb)),
                      (:sid, 'assistant', :a, CAST(:ap AS jsonb))
                    """
                ),
                {
                    "sid": sid,
                    "q": entry.question,
                    "a": entry.answer or "",
                    "up": json.dumps({"tcg": tcg}),
                    "ap": json.dumps(
                        {
                            "success": entry.success,
                            "confidence": entry.confidence,
                            "sources": entry.sources,
                            "verdict": entry.verdict,
                            "rule_applied": entry.rule_applied,
                        }
                    ),
                },
            )
            migrated += 1
        except Exception:
            logger.warning("history_migrate_entry_failed", tcg=tcg, exc_info=True)
    await session.commit()
    return {"migrated": migrated, "integrity_status": "ok"}


class SavedAnswerBody(BaseModel):
    game_slug: str
    question: str
    verdict: str | None = None
    sources: list[dict[str, Any]] = Field(default_factory=list)
    full_response: dict[str, Any] = Field(default_factory=dict)


@router.post("/runtime/judge/saved-answers", status_code=201)
async def create_saved_answer(
    body: SavedAnswerBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, str]:
    user_id = _require_user_id(x_judge_user_id)
    try:
        row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.saved_answers
                      (user_id, game_slug, question, verdict, sources, full_response)
                    VALUES (:uid, :game, :q, :v, CAST(:sources AS jsonb), CAST(:full AS jsonb))
                    RETURNING id
                    """
                ),
                {
                    "uid": user_id,
                    "game": body.game_slug.strip().lower(),
                    "q": body.question.strip(),
                    "v": body.verdict,
                    "sources": json.dumps(body.sources),
                    "full": json.dumps(body.full_response),
                },
            )
        ).mappings().first()
        await session.commit()
        await record_growth_metric(session, "favorites_saved", game=body.game_slug)
    except Exception:
        logger.warning("saved_answer_create_failed", exc_info=True)
        raise HTTPException(status_code=503, detail="Favoritos indisponíveis") from None
    return {"id": str(row["id"]) if row else "", "status": "saved"}


@router.get("/runtime/judge/saved-answers")
async def list_saved_answers(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user_id(x_judge_user_id)
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT id, game_slug, question, verdict, sources, full_response, created_at
                    FROM tcg_judge.saved_answers
                    WHERE user_id = :uid
                    ORDER BY created_at DESC
                    LIMIT 50
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().all()
    except Exception:
        return {"items": [], "integrity_status": "degraded"}
    items = []
    for r in rows:
        items.append(
            {
                "id": str(r["id"]),
                "game_slug": r["game_slug"],
                "question": r["question"],
                "verdict": r.get("verdict"),
                "sources": r.get("sources") or [],
                "full_response": r.get("full_response") or {},
                "created_at": _iso(r.get("created_at")),
            }
        )
    return {"items": items, "integrity_status": "ok"}


@router.delete("/runtime/judge/account", status_code=200)
async def delete_judge_account(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, str]:
    """LGPD: remove dados do utilizador nas tabelas Judge (sessões, favoritos, métricas)."""
    user_id = _require_user_id(x_judge_user_id)
    try:
        await session.execute(
            text("DELETE FROM tcg_judge.judge_session_messages WHERE session_id IN "
                 "(SELECT id FROM tcg_judge.judge_sessions WHERE auth_user_id = :uid)"),
            {"uid": user_id},
        )
        await session.execute(
            text("DELETE FROM tcg_judge.judge_sessions WHERE auth_user_id = :uid"),
            {"uid": user_id},
        )
        await session.execute(
            text("DELETE FROM tcg_judge.saved_answers WHERE user_id = :uid"),
            {"uid": user_id},
        )
        await session.execute(
            text("DELETE FROM tcg_judge.judge_growth_metrics WHERE user_id = :uid"),
            {"uid": user_id},
        )
        await session.commit()
    except Exception:
        logger.warning("account_delete_failed", exc_info=True)
        raise HTTPException(status_code=503, detail="Exclusão indisponível") from None
    return {"status": "deleted", "note": "Revogue acesso OAuth no Supabase Dashboard se necessário."}


def _message_dict(row: Any) -> dict[str, Any]:
    payload = row.get("payload")
    if not isinstance(payload, dict):
        payload = json.loads(payload) if payload else {}
    return {
        "id": str(row["id"]),
        "role": str(row["role"]),
        "content": str(row["content"]),
        "payload": payload,
        "created_at": _iso(row.get("created_at")),
    }


def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)
