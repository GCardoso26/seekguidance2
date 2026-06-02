"""Rotas admin de ingestão — RBAC ingestion_admin."""

from __future__ import annotations

from typing import Annotated, Any

from app.api.deps import DbSession
from app.core.security.deps import required_auth
from app.core.security.rbac import has_permission
from app.runtime.runtime_document_diagnostics.engine import list_document_errors, record_document_error
from app.runtime.runtime_ingestion_admin.engine import (
    enqueue_reindex,
    ingestion_status_by_game,
    list_ingestion_jobs,
    store_uploaded_pdf_metadata,
)
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

router = APIRouter(prefix="/runtime/admin/ingestion", tags=["ingestion-admin"])


class ReindexBody(BaseModel):
    game_slug: str = Field(..., min_length=1, max_length=64)


def _require_ingestion_admin(auth: dict[str, Any]) -> None:
    role = auth.get("role", "viewer")
    if not has_permission(role, "ingestion_admin") and not has_permission(role, "tenant_admin"):
        raise HTTPException(status_code=403, detail="Permissão ingestion_admin necessária")


@router.get("/jobs")
async def get_ingestion_jobs(
    session: DbSession,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
    limit: int = 50,
) -> dict[str, Any]:
    _require_ingestion_admin(auth)
    jobs = await list_ingestion_jobs(session, limit=limit)
    return {"jobs": jobs}


@router.get("/status")
async def get_ingestion_status(
    session: DbSession,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
) -> dict[str, Any]:
    _require_ingestion_admin(auth)
    games = await ingestion_status_by_game(session)
    return {"games": games}


@router.post("/reindex")
async def post_reindex(
    body: ReindexBody,
    session: DbSession,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
) -> dict[str, Any]:
    _require_ingestion_admin(auth)
    actor = auth.get("username") or auth.get("sub")
    return await enqueue_reindex(session, game_slug=body.game_slug, actor=str(actor) if actor else None)


@router.post("/upload")
async def post_upload_pdf(
    session: DbSession,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
    game_slug: str = Form(...),
    file: UploadFile = File(...),
) -> dict[str, Any]:
    _require_ingestion_admin(auth)
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        await record_document_error(
            session,
            game_slug=game_slug,
            stage="upload",
            exception=ValueError("Apenas PDF permitido"),
            filename=file.filename,
        )
        raise HTTPException(status_code=400, detail="Apenas ficheiros PDF")
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF demasiado grande (max 25MB)")
    actor = auth.get("username") or auth.get("sub")
    meta = await store_uploaded_pdf_metadata(
        session,
        game_slug=game_slug,
        filename=file.filename,
        content=content,
        uploaded_by=str(actor) if actor else None,
    )
    if meta.get("error"):
        await record_document_error(
            session,
            game_slug=game_slug,
            stage="upload",
            exception=RuntimeError(meta["error"]),
            filename=file.filename,
        )
        raise HTTPException(status_code=503, detail="Falha ao persistir upload")
    return {"status": "accepted", "upload": meta, "note": "Pipeline de chunking/embeddings via job reindex"}


@router.get("/errors")
async def get_ingestion_errors(
    session: DbSession,
    auth: Annotated[dict[str, Any], Depends(required_auth)],
    game_slug: str | None = None,
    stage: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    _require_ingestion_admin(auth)
    errors = await list_document_errors(session, game_slug=game_slug, stage=stage, limit=limit)
    return {"errors": errors}
