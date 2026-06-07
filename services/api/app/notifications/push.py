"""Web Push via VAPID (pywebpush)."""

from __future__ import annotations

import json
import os
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


class WebPushService:
    def __init__(self) -> None:
        self.vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
        self.vapid_claims = {"sub": os.getenv("VAPID_CONTACT", "mailto:admin@tcg-judge.com")}

    def enabled(self) -> bool:
        return bool(self.vapid_private_key)

    async def save_subscription(
        self,
        session: AsyncSession,
        player_id: str,
        *,
        endpoint: str,
        p256dh: str,
        auth: str,
        user_agent: str | None = None,
    ) -> None:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.push_subscriptions (player_id, endpoint, p256dh, auth, user_agent)
                VALUES (:pid, :ep, :p256, :auth, :ua)
                ON CONFLICT (endpoint) DO UPDATE SET
                  player_id = EXCLUDED.player_id,
                  p256dh = EXCLUDED.p256dh,
                  auth = EXCLUDED.auth
                """
            ),
            {"pid": player_id, "ep": endpoint, "p256": p256dh, "auth": auth, "ua": user_agent},
        )
        await session.commit()

    async def send(self, session: AsyncSession, user_id: str, payload: dict[str, Any]) -> bool:
        if not self.enabled():
            logger.info("web_push_stub", user_id=user_id, event=payload.get("event_type"))
            return True

        rows = (
            await session.execute(
                text("SELECT endpoint, p256dh, auth FROM tcg_judge.push_subscriptions WHERE player_id = :id"),
                {"id": user_id},
            )
        ).mappings().all()

        if not rows:
            return False

        try:
            from pywebpush import WebPushException, webpush
        except ImportError:
            logger.warning("pywebpush_not_installed")
            return False

        push_payload = json.dumps(
            {
                "title": payload.get("title", "Judge TCG"),
                "body": payload.get("body", ""),
                "tag": payload.get("event_type"),
                "url": payload.get("data", {}).get("url", "/"),
                "data": payload.get("data", {}),
            }
        )

        sent_any = False
        for sub in rows:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub["endpoint"],
                        "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
                    },
                    data=push_payload,
                    vapid_private_key=self.vapid_private_key,
                    vapid_claims=self.vapid_claims,
                )
                sent_any = True
            except WebPushException as exc:
                if exc.response and exc.response.status_code == 410:
                    await session.execute(
                        text("DELETE FROM tcg_judge.push_subscriptions WHERE endpoint = :ep"),
                        {"ep": sub["endpoint"]},
                    )
                logger.warning("web_push_failed", endpoint=sub["endpoint"][:40], error=str(exc))

        if sent_any:
            await session.commit()
        return sent_any


web_push_service = WebPushService()
