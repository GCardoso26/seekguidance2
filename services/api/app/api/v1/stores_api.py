"""API de lojas verificadas."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.reviews.review import list_reviews
from app.stores import store as store_svc
from app.stores import accreditation_applications as accreditation_apps
from app.stores.subscriptions import subscribe_store
from app.stores.verification import request_verification
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["stores"])


class StoreCreateBody(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    slug: str = Field(min_length=3, max_length=50)
    cnpj: str = Field(min_length=14, max_length=18)
    description: str | None = None
    email: str
    city: str | None = None
    country: str = "BR"


class StoreUpdateBody(BaseModel):
    name: str | None = None
    description: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    website: str | None = None
    discord: str | None = None
    city: str | None = None
    cnpj: str | None = None


class VerifyBody(BaseModel):
    documents: list[str] | None = None


class SubscribeBody(BaseModel):
    plan: str = Field(pattern="^(lojista|pro|enterprise)$")


class AccreditationPatchBody(BaseModel):
    answers: dict[str, Any] | None = None
    current_step: int | None = Field(default=None, ge=1, le=8)


@router.get("/runtime/judge/stores/cnpj-lookup")
async def cnpj_lookup(cnpj: str) -> dict[str, Any]:
    """Consulta cadastral (BrasilAPI). Somente leitura — não aprova credenciamento."""
    import httpx

    from app.stores.cnpj import format_cnpj, is_valid_cnpj, only_digits

    if not is_valid_cnpj(cnpj):
        raise HTTPException(400, "CNPJ inválido")
    digits = only_digits(cnpj)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(f"https://brasilapi.com.br/api/cnpj/v1/{digits}")
    except httpx.HTTPError as exc:
        raise HTTPException(503, "Consulta CNPJ indisponível") from exc
    if res.status_code == 404:
        raise HTTPException(404, "CNPJ não encontrado")
    if res.status_code >= 400:
        raise HTTPException(502, "Consulta CNPJ falhou")
    data = res.json()
    return {
        "cnpj": format_cnpj(digits),
        "razao_social": data.get("razao_social") or data.get("nome"),
        "nome_fantasia": data.get("nome_fantasia"),
        "descricao_situacao_cadastral": data.get("descricao_situacao_cadastral"),
        "situacao_cadastral": data.get("situacao_cadastral"),
        "logradouro": data.get("logradouro"),
        "numero": data.get("numero"),
        "bairro": data.get("bairro"),
        "municipio": data.get("municipio"),
        "uf": data.get("uf"),
        "cep": data.get("cep"),
        "cnae_fiscal_descricao": data.get("cnae_fiscal_descricao"),
        "confirmation_required": True,
        "auto_approved": False,
    }


@router.get("/runtime/judge/stores/accreditation/mine")
async def accreditation_mine(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    app = await accreditation_apps.get_mine(session, user_id)
    return {"application": app}


@router.post("/runtime/judge/stores/accreditation")
async def accreditation_create(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    app = await accreditation_apps.create_draft(session, user_id)
    return {"application": app}


@router.patch("/runtime/judge/stores/accreditation/{app_id}")
async def accreditation_patch(
    session: DbSession,
    app_id: str,
    body: AccreditationPatchBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    app = await accreditation_apps.update_draft(
        session,
        app_id,
        user_id,
        answers=body.answers,
        current_step=body.current_step,
    )
    return {"application": app}


@router.post("/runtime/judge/stores/accreditation/{app_id}/submit")
async def accreditation_submit(
    session: DbSession,
    app_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    app = await accreditation_apps.submit(session, app_id, user_id)
    return {"application": app}


@router.post("/runtime/judge/stores")
async def create_store(
    session: DbSession,
    body: StoreCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await store_svc.create_store(
        session,
        user_id,
        name=body.name,
        slug=body.slug,
        cnpj=body.cnpj,
        description=body.description,
        email=body.email,
        city=body.city,
        country=body.country,
    )


@router.get("/runtime/judge/stores/mine")
async def my_stores(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    user_id = _require_user(x_judge_user_id)
    return await store_svc.list_owner_stores(session, user_id)


@router.get("/runtime/judge/stores")
async def list_stores(
    session: DbSession,
    city: str | None = None,
    country: str | None = None,
    verified_only: bool = False,
) -> list[dict[str, Any]]:
    return await store_svc.list_stores(session, city=city, country=country, verified_only=verified_only)


@router.get("/runtime/judge/stores/{slug}")
async def get_store(session: DbSession, slug: str) -> dict[str, Any]:
    s = await store_svc.get_store_by_slug(session, slug)
    if not s:
        raise HTTPException(404, "Loja não encontrada")
    tournaments = await store_svc.get_store_tournaments(session, str(s["id"]))
    reviews = await list_reviews(session, "store", str(s["id"]))
    return {"store": s, "tournaments": tournaments, "reviews": reviews}


@router.put("/runtime/judge/stores/{store_id}")
async def update_store(
    session: DbSession,
    store_id: str,
    body: StoreUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await store_svc.update_store(session, store_id, user_id, body.model_dump(exclude_none=True))


@router.post("/runtime/judge/stores/{store_id}/verify")
async def verify_store(
    session: DbSession,
    store_id: str,
    body: VerifyBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await request_verification(session, store_id, user_id, documents=body.documents)


@router.post("/runtime/judge/stores/{store_id}/subscribe")
async def store_subscribe(
    session: DbSession,
    store_id: str,
    body: SubscribeBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await subscribe_store(session, store_id, user_id, body.plan)


@router.get("/runtime/judge/stores/{store_id}/tournaments")
async def store_tournaments(session: DbSession, store_id: str) -> list[dict[str, Any]]:
    return await store_svc.get_store_tournaments(session, store_id)


@router.get("/runtime/judge/stores/{store_id}/reviews")
async def store_reviews(session: DbSession, store_id: str) -> list[dict[str, Any]]:
    return await list_reviews(session, "store", store_id)
