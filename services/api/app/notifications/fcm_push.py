"""Firebase Cloud Messaging via Admin SDK."""

from __future__ import annotations

import os
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

_firebase_initialized = False


def _init_firebase() -> bool:
    global _firebase_initialized
    if _firebase_initialized:
        return True

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    if not project_id or not private_key or not client_email:
        return False

    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._apps:
            _firebase_initialized = True
            return True

        cred = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key.replace("\\n", "\n"),
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        return True
    except Exception as exc:
        logger.warning("firebase_init_failed", error=str(exc))
        return False


class FcmPushService:
    def enabled(self) -> bool:
        return _init_firebase()

    async def save_token(
        self,
        session: AsyncSession,
        user_id: str,
        *,
        token: str,
        platform: str = "web",
    ) -> None:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.user_fcm_tokens (user_id, token, platform, updated_at)
                VALUES (:uid, :token, :platform, NOW())
                ON CONFLICT (user_id, token) DO UPDATE SET
                  platform = EXCLUDED.platform,
                  updated_at = NOW()
                """
            ),
            {"uid": user_id, "token": token, "platform": platform},
        )
        await session.commit()

    async def remove_token(self, session: AsyncSession, token: str) -> None:
        await session.execute(
            text("DELETE FROM tcg_judge.user_fcm_tokens WHERE token = :token"),
            {"token": token},
        )
        await session.commit()

    async def send(self, session: AsyncSession, user_id: str, payload: dict[str, Any]) -> bool:
        if not self.enabled():
            logger.info("fcm_push_disabled", user_id=user_id, event=payload.get("event_type"))
            return False

        rows = (
            await session.execute(
                text("SELECT token FROM tcg_judge.user_fcm_tokens WHERE user_id = :id"),
                {"id": user_id},
            )
        ).mappings().all()
        if not rows:
            return False

        try:
            from firebase_admin import messaging
        except ImportError:
            logger.warning("firebase_admin_not_installed")
            return False

        data = payload.get("data") or {}
        notification = messaging.Notification(
            title=str(payload.get("title", "Judge TCG")),
            body=str(payload.get("body") or ""),
        )
        sent_any = False

        for row in rows:
            token = str(row["token"])
            message = messaging.Message(
                notification=notification,
                data={k: str(v) for k, v in data.items()},
                token=token,
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        title=str(payload.get("title", "Judge TCG")),
                        body=str(payload.get("body") or ""),
                    )
                ),
            )
            try:
                messaging.send(message)
                sent_any = True
            except Exception as exc:
                err = str(exc)
                if "registration-token-not-registered" in err or "UnregisteredError" in err:
                    await self.remove_token(session, token)
                logger.warning("fcm_send_failed", token=token[:12], error=err)

        return sent_any


fcm_push_service = FcmPushService()
