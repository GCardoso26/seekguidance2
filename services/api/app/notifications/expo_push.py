"""Expo Push Notifications para app nativo."""

from __future__ import annotations

import json
from typing import Any

import httpx
import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


class ExpoPushService:
    async def save_token(
        self,
        session: AsyncSession,
        user_id: str,
        *,
        token: str,
        platform: str | None = None,
    ) -> None:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.user_push_tokens (user_id, token, platform, updated_at)
                VALUES (:uid, :token, :platform, NOW())
                ON CONFLICT (user_id, token) DO UPDATE SET
                  platform = EXCLUDED.platform,
                  updated_at = NOW()
                """
            ),
            {"uid": user_id, "token": token, "platform": platform},
        )
        await session.commit()

    async def send(self, session: AsyncSession, user_id: str, payload: dict[str, Any]) -> bool:
        rows = (
            await session.execute(
                text("SELECT token FROM tcg_judge.user_push_tokens WHERE user_id = :id"),
                {"id": user_id},
            )
        ).mappings().all()

        if not rows:
            return False

        messages = [
            {
                "to": row["token"],
                "title": payload.get("title", "Judge TCG"),
                "body": payload.get("body", ""),
                "data": payload.get("data", {}),
                "sound": "default",
            }
            for row in rows
        ]

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    EXPO_PUSH_URL,
                    headers={"Content-Type": "application/json", "Accept": "application/json"},
                    json=messages,
                )
                if res.status_code >= 400:
                    logger.warning("expo_push_failed", status=res.status_code, body=res.text[:200])
                    return False
                body = res.json()
                tickets = body.get("data") if isinstance(body, dict) else []
                return bool(tickets)
        except Exception as exc:
            logger.warning("expo_push_error", error=str(exc))
            return False


expo_push_service = ExpoPushService()
