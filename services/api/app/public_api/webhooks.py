"""Webhooks para integrações."""

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from typing import Any

import httpx
import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


async def create_webhook(
    session: AsyncSession,
    owner_id: str,
    *,
    url: str,
    events: list[str],
) -> dict[str, Any]:
    secret = secrets.token_urlsafe(32)
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.webhooks (owner_id, url, events, secret)
                VALUES (:oid, :url, :events, :secret)
                RETURNING id, url, events, active, created_at
                """
            ),
            {"oid": owner_id, "url": url, "events": events, "secret": secret},
        )
    ).mappings().first()
    await session.commit()
    result = dict(row) if row else {}
    result["secret"] = secret
    return result


async def list_webhooks(session: AsyncSession, owner_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT id, url, events, active, last_delivery_at, last_error
                FROM tcg_judge.webhooks WHERE owner_id = :oid
                """
            ),
            {"oid": owner_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


def sign_payload(secret: str, payload: bytes) -> str:
    return hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()


async def dispatch_webhooks(session: AsyncSession, event: str, payload: dict[str, Any]) -> int:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.webhooks
                WHERE active = true AND :evt = ANY(events)
                """
            ),
            {"evt": event},
        )
    ).mappings().all()

    sent = 0
    body = json.dumps({"event": event, "data": payload}).encode()
    for wh in rows:
        sig = sign_payload(wh["secret"], body)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    wh["url"],
                    content=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Judge-Signature": sig,
                        "X-Judge-Event": event,
                    },
                )
            ok = resp.status_code < 400
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.webhooks SET
                      last_delivery_at = NOW(),
                      last_error = CASE WHEN :ok THEN NULL ELSE :err END
                    WHERE id = :id
                    """
                ),
                {"ok": ok, "err": None if ok else f"HTTP {resp.status_code}", "id": wh["id"]},
            )
            if ok:
                sent += 1
        except Exception as exc:
            await session.execute(
                text("UPDATE tcg_judge.webhooks SET last_error = :err WHERE id = :id"),
                {"err": str(exc)[:500], "id": wh["id"]},
            )
            logger.warning("webhook_delivery_failed", webhook_id=wh["id"], error=str(exc))

    await session.commit()
    return sent
