"""Autenticação por API Key."""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime
from typing import Any

from app.api.deps import DbSession
from fastapi import Header, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

PLAN_LIMITS = {"free": 10_000, "pro": 50_000, "enterprise": 1_000_000}


def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def generate_api_key() -> tuple[str, str, str]:
    raw = f"jtcg_live_{secrets.token_urlsafe(24)}"
    return raw, hash_api_key(raw), raw[:16]


async def create_api_key(session: AsyncSession, owner_id: str, plan: str = "free") -> dict[str, Any]:
    raw, key_hash, prefix = generate_api_key()
    limit = PLAN_LIMITS.get(plan, 10_000)
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.api_keys (owner_id, key_hash, key_prefix, plan, rate_limit_monthly)
                VALUES (:oid, :hash, :prefix, :plan, :lim)
                RETURNING id, key_prefix, plan, rate_limit_monthly, created_at
                """
            ),
            {"oid": owner_id, "hash": key_hash, "prefix": prefix, "plan": plan, "lim": limit},
        )
    ).mappings().first()
    await session.commit()
    result = dict(row) if row else {}
    result["apiKey"] = raw
    return result


async def validate_api_key(
    session: AsyncSession,
    api_key: str | None,
) -> dict[str, Any]:
    if not api_key or not api_key.startswith("jtcg_"):
        raise HTTPException(401, "API key inválida")
    key_hash = hash_api_key(api_key)
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.api_keys
                WHERE key_hash = :hash AND revoked_at IS NULL
                """
            ),
            {"hash": key_hash},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(401, "API key inválida ou revogada")

    month = datetime.now(UTC).strftime("%Y-%m")
    usage = int(row["usage_count"])
    if row["usage_month"] != month:
        usage = 0
        await session.execute(
            text("UPDATE tcg_judge.api_keys SET usage_count = 0, usage_month = :m WHERE id = :id"),
            {"m": month, "id": row["id"]},
        )

    limit = int(row["rate_limit_monthly"])
    if usage >= limit:
        raise HTTPException(429, "Limite mensal de API excedido")

    await session.execute(
        text(
            """
            UPDATE tcg_judge.api_keys SET
              usage_count = CASE WHEN usage_month = :m THEN usage_count + 1 ELSE 1 END,
              usage_month = :m,
              last_used_at = NOW()
            WHERE id = :id
            """
        ),
        {"m": month, "id": row["id"]},
    )
    await session.commit()
    return {
        **dict(row),
        "usage_count": usage + 1,
        "remaining": max(0, limit - usage - 1),
    }


async def require_api_key(
    session: DbSession,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    return await validate_api_key(session, x_api_key)
