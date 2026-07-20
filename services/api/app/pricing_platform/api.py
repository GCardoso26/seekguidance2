"""Pricing + Inventory + Import Monitor APIs."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user

router = APIRouter(tags=["pricing-inventory"])


@router.get("/runtime/judge/pricing/valuation/{subject_type}/{subject_id}")
async def get_valuation(
    session: DbSession,
    subject_type: str,
    subject_id: str,
    currency: str = Query(default="BRL"),
) -> dict[str, Any]:
    if subject_type not in ("catalog_card", "catalog_variant", "product_variant"):
        raise HTTPException(400, detail="invalid_subject_type")
    try:
        res = await session.execute(
            text(
                """
                SELECT * FROM pricing.aggregated_valuations
                WHERE subject_type = :st AND subject_id = CAST(:sid AS uuid) AND currency = :cur
                LIMIT 1
                """
            ),
            {"st": subject_type, "sid": subject_id, "cur": currency},
        )
        row = res.fetchone()
    except Exception as exc:
        raise HTTPException(503, detail=f"pricing_unavailable:{exc}") from exc
    if not row:
        return {"valuation": None, "subject_type": subject_type, "subject_id": subject_id}
    return {"valuation": dict(row._mapping)}


@router.get("/runtime/judge/pricing/history/{subject_type}/{subject_id}")
async def pricing_history(
    session: DbSession,
    subject_type: str,
    subject_id: str,
    metric: str = Query(default="suggested"),
    limit: int = Query(default=90, ge=1, le=365),
) -> dict[str, Any]:
    res = await session.execute(
        text(
            """
            SELECT price_cents, currency, metric, recorded_at, market_id
            FROM pricing.price_quote_history
            WHERE subject_type = :st AND subject_id = CAST(:sid AS uuid) AND metric = :metric
            ORDER BY recorded_at DESC
            LIMIT :lim
            """
        ),
        {"st": subject_type, "sid": subject_id, "metric": metric, "lim": limit},
    )
    return {"points": [dict(r._mapping) for r in res.fetchall()]}


@router.get("/runtime/judge/product-catalog/import-monitor")
async def import_monitor(session: DbSession) -> dict[str, Any]:
    try:
        providers = await session.execute(
            text(
                """
                SELECT provider_id, category, enabled, schedule_kind, next_run_at,
                       last_sync_at, last_status, last_error, rate_limit_rpm, circuit_open_until
                FROM product_catalog.provider_registry
                ORDER BY updated_at DESC NULLS LAST
                LIMIT 100
                """
            )
        )
        runs = await session.execute(
            text(
                """
                SELECT id, provider_id, job_key, status, started_at, finished_at, duration_ms,
                       items_new, items_updated, items_failed, rate_limit_hits, errors
                FROM product_catalog.import_runs
                ORDER BY started_at DESC
                LIMIT 50
                """
            )
        )
        # Fallback: sync_runs if import_runs empty
        sync_fallback = await session.execute(
            text(
                """
                SELECT job_key AS provider_id, provider_id AS job_key, status, started_at, finished_at,
                       duration_ms, items_upserted AS items_updated, errors
                FROM product_catalog.sync_runs
                ORDER BY started_at DESC
                LIMIT 30
                """
            )
        )
    except Exception as exc:
        raise HTTPException(503, detail=f"import_monitor_unavailable:{exc}") from exc

    return {
        "providers": [dict(r._mapping) for r in providers.fetchall()],
        "import_runs": [dict(r._mapping) for r in runs.fetchall()],
        "sync_runs_fallback": [dict(r._mapping) for r in sync_fallback.fetchall()],
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/inventory/stock")
async def list_stock(
    session: DbSession,
    store_id: str | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    params: dict[str, Any] = {}
    where = "1=1"
    if store_id:
        where = "store_id = CAST(:sid AS uuid)"
        params["sid"] = store_id
    try:
        res = await session.execute(
            text(
                f"""
                SELECT id, store_id, subject_type, subject_id, condition,
                       on_hand, reserved, available, updated_at
                FROM inventory.stock_units
                WHERE {where}
                ORDER BY updated_at DESC
                LIMIT 200
                """
            ),
            params,
        )
    except Exception as exc:
        raise HTTPException(503, detail=f"inventory_unavailable:{exc}") from exc
    return {"items": [dict(r._mapping) for r in res.fetchall()]}


@router.get("/runtime/judge/product-catalog/quality")
async def products_needing_enrichment(
    session: DbSession,
    max_score: float = Query(default=70, ge=0, le=100),
    limit: int = Query(default=50, ge=1, le=200),
) -> dict[str, Any]:
    res = await session.execute(
        text(
            """
            SELECT id, title_pt, quality_score, quality_breakdown, category
            FROM product_catalog.products
            WHERE quality_score IS NULL OR quality_score < :max_score
            ORDER BY coalesce(quality_score, 0) ASC
            LIMIT :lim
            """
        ),
        {"max_score": max_score, "lim": limit},
    )
    return {"items": [dict(r._mapping) for r in res.fetchall()]}
