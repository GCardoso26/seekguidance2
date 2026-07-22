"""CRUD de lojas verificadas."""

from __future__ import annotations

import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.players.store import ensure_player_profile

SLUG_RE = re.compile(r"^[a-z0-9-]{3,50}$")

PLAN_FEATURES: dict[str, list[str]] = {
    "free": [],
    "pro": ["custom_branding", "analytics_advanced", "priority_support", "commission_reduction"],
    "enterprise": [
        "custom_branding",
        "analytics_advanced",
        "priority_support",
        "api_access",
        "featured_listing",
        "commission_reduction",
    ],
}

COMMISSION_BY_PLAN = {"free": 10, "pro": 7, "enterprise": 5}


async def list_owner_stores(session: AsyncSession, owner_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.stores
                WHERE owner_id = :oid
                ORDER BY
                  CASE WHEN shop_enabled THEN 0 ELSE 1 END,
                  CASE lower(COALESCE(subscription_plan, 'free'))
                    WHEN 'enterprise' THEN 0
                    WHEN 'pro' THEN 1
                    WHEN 'lojista' THEN 2
                    ELSE 3
                  END,
                  created_at DESC
                """
            ),
            {"oid": owner_id},
        )
    ).mappings().all()
    return [_serialize_store(dict(r)) for r in rows]


async def create_store(
    session: AsyncSession,
    owner_id: str,
    *,
    name: str,
    slug: str,
    description: str | None = None,
    email: str,
    city: str | None = None,
    country: str = "BR",
) -> dict[str, Any]:
    slug = slug.lower().strip()
    if not SLUG_RE.match(slug):
        raise HTTPException(400, "Slug inválido")
    existing = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE LOWER(slug) = LOWER(:slug)"),
            {"slug": slug},
        )
    ).mappings().first()
    if existing:
        raise HTTPException(409, "Este slug já está em uso. Escolha outro.")
    await ensure_player_profile(session, owner_id)
    try:
        row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.stores (owner_id, name, slug, description, email, city, country)
                    VALUES (:oid, :name, :slug, :desc, :email, :city, :country)
                    RETURNING *
                    """
                ),
                {
                    "oid": owner_id,
                    "name": name,
                    "slug": slug,
                    "desc": description,
                    "email": email,
                    "city": city,
                    "country": country,
                },
            )
        ).mappings().first()
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(409, "Este slug já está em uso. Escolha outro.") from exc
    return _serialize_store(dict(row) if row else {})


async def get_store_by_slug(session: AsyncSession, slug: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE LOWER(slug) = LOWER(:slug)"),
            {"slug": slug},
        )
    ).mappings().first()
    return _serialize_store(dict(row)) if row else None


async def list_stores(
    session: AsyncSession,
    *,
    city: str | None = None,
    country: str | None = None,
    verified_only: bool = False,
    limit: int = 20,
    offset: int = 0,
) -> list[dict[str, Any]]:
    clauses = ["1=1"]
    params: dict[str, Any] = {"lim": limit, "off": offset}
    if city:
        clauses.append("city ILIKE :city")
        params["city"] = f"%{city}%"
    if country:
        clauses.append("country = :country")
        params["country"] = country.upper()
    if verified_only:
        clauses.append("verification_status = 'verified'")
    sql = f"""
        SELECT * FROM tcg_judge.stores
        WHERE {' AND '.join(clauses)}
        ORDER BY average_rating DESC, review_count DESC
        LIMIT :lim OFFSET :off
    """
    rows = (await session.execute(text(sql), params)).mappings().all()
    return [_serialize_store(dict(r)) for r in rows]


async def update_store(session: AsyncSession, store_id: str, owner_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    allowed = {
        "name", "description", "logo_url", "banner_url", "address", "city", "state",
        "country", "phone", "email", "website", "discord", "lat", "lng",
    }
    sets = []
    params: dict[str, Any] = {"id": store_id, "oid": owner_id}
    for k, v in fields.items():
        if k in allowed and v is not None:
            sets.append(f"{k} = :{k}")
            params[k] = v
    if not sets:
        raise HTTPException(400, "Nada para atualizar")
    row = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.stores SET {', '.join(sets)}, updated_at = NOW()
                WHERE id = :id AND owner_id = :oid RETURNING *
                """
            ),
            params,
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    await session.commit()
    return _serialize_store(dict(row))


async def get_store_tournaments(session: AsyncSession, store_id: str, limit: int = 10) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT t.*,
                  (SELECT COUNT(*) FROM tcg_judge.tournament_participants tp
                   WHERE tp.tournament_id = t.id) AS registered
                FROM tcg_judge.tournaments t
                WHERE t.store_id = :sid OR t.created_by = (SELECT owner_id FROM tcg_judge.stores WHERE id = :sid)
                ORDER BY t.starts_at DESC NULLS LAST
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


def _serialize_store(row: dict[str, Any]) -> dict[str, Any]:
    if not row:
        return row
    plan = row.get("subscription_plan", "free")
    return {
        **row,
        "features": PLAN_FEATURES.get(plan, []),
        "commissionPercent": COMMISSION_BY_PLAN.get(plan, 10),
        "verified": row.get("verification_status") == "verified",
    }
