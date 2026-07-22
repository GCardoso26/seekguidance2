"""HTTP público do Assets BC — upload/ingest lojista via Asset Pipeline."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.assets.asset_ingest import ingest_asset, list_entity_assets, unlink_asset
from app.marketplace import seller_dashboard as seller_dash

router = APIRouter(tags=["assets"])


@router.post("/runtime/judge/assets/ingest")
async def assets_ingest(
    session: DbSession,
    body: dict[str, Any],
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    """Fonte (URL pública) → SHA256 → media.assets + media.asset_links."""
    user_id = _require_user(x_judge_user_id)
    source_url = (body.get("source_url") or body.get("sourceUrl") or "").strip()
    entity_type = (body.get("entity_type") or body.get("entityType") or "").strip()
    entity_id = (body.get("entity_id") or body.get("entityId") or "").strip()
    role = (body.get("role") or "front").strip()
    if not source_url or not entity_type or not entity_id:
        raise HTTPException(status_code=400, detail="source_url_entity_required")

    # Seller só vincula a produtos da própria loja (store_product).
    if entity_type == "store_product":
        store = await seller_dash.resolve_owner_store(session, user_id)
        owned = await session.execute(
            text(
                """
                SELECT 1 FROM tcg_judge.store_products
                WHERE id = CAST(:pid AS uuid) AND store_id = CAST(:sid AS uuid)
                LIMIT 1
                """
            ),
            {"pid": entity_id, "sid": str(store["id"])},
        )
        if not owned.fetchone():
            raise HTTPException(status_code=403, detail="store_product_not_owned")

    try:
        result = await ingest_asset(
            session,
            source_url=source_url,
            entity_type=entity_type,
            entity_id=entity_id,
            role=role,
            sort_order=int(body.get("sort_order") or body.get("sortOrder") or 0),
            request_id=body.get("request_id") or body.get("requestId"),
            media_type=body.get("media_type") or body.get("mediaType"),
            alt=body.get("alt"),
            provider_id=body.get("provider_id") or body.get("providerId") or "seller_upload",
        )
        # Espelha URL no array legado images[] quando for produto da loja (não SoT).
        if entity_type == "store_product" and result["asset"].get("cdn_url"):
            url = result["asset"]["cdn_url"]
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_products
                    SET images = (
                      SELECT COALESCE(jsonb_agg(to_jsonb(u)), '[]'::jsonb)
                      FROM (
                        SELECT :url AS u
                        UNION
                        SELECT jsonb_array_elements_text(COALESCE(images, '[]'::jsonb))
                      ) q
                    ),
                    updated_at = now()
                    WHERE id = CAST(:pid AS uuid)
                    """
                ),
                {"url": url, "pid": entity_id},
            )
        await session.commit()
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"asset_ingest_failed:{exc}") from exc


@router.delete("/runtime/judge/assets/links")
async def assets_unlink(
    session: DbSession,
    body: dict[str, Any],
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    entity_type = (body.get("entity_type") or body.get("entityType") or "").strip()
    entity_id = (body.get("entity_id") or body.get("entityId") or "").strip()
    if not entity_type or not entity_id:
        raise HTTPException(status_code=400, detail="entity_required")

    if entity_type == "store_product":
        store = await seller_dash.resolve_owner_store(session, user_id)
        owned = await session.execute(
            text(
                """
                SELECT 1 FROM tcg_judge.store_products
                WHERE id = CAST(:pid AS uuid) AND store_id = CAST(:sid AS uuid)
                LIMIT 1
                """
            ),
            {"pid": entity_id, "sid": str(store["id"])},
        )
        if not owned.fetchone():
            raise HTTPException(status_code=403, detail="store_product_not_owned")

    result = await unlink_asset(
        session,
        entity_type=entity_type,
        entity_id=entity_id,
        role=body.get("role"),
        asset_id=body.get("asset_id") or body.get("assetId"),
    )
    await session.commit()
    return result


@router.get("/runtime/judge/assets/entity/{entity_type}/{entity_id}")
async def assets_for_entity(
    session: DbSession,
    entity_type: str,
    entity_id: str,
) -> dict[str, Any]:
    try:
        return await list_entity_assets(session, entity_type=entity_type, entity_id=entity_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"assets_unavailable:{exc}") from exc
