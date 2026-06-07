"""Serviço de notificações — in-app + stubs push/email/SMS."""

from __future__ import annotations

import json
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

EVENT_TITLES: dict[str, str] = {
    "round:starting": "Rodada a começar",
    "timer:warning": "5 minutos restantes",
    "pairing:assigned": "Emparelhamento atribuído",
    "result:reported": "Resultado reportado",
    "result:confirmed": "Resultado confirmado",
    "result:disputed": "Resultado disputado",
    "standings:updated": "Standings atualizados",
    "tournament:finished": "Torneio finalizado",
    "achievement:unlocked": "Nova conquista",
    "tournament:check_in_reminder": "Lembrete de check-in",
    "payment:confirmed": "Pagamento confirmado",
    "judge_call:open": "Nova chamada de juiz",
    "judge_call:accepted": "Juiz a caminho",
    "judge_call:resolved": "Chamada resolvida",
    "judge_call:escalated": "Chamada escalada",
}


class PushService:
    async def send(self, session: AsyncSession, user_id: str, payload: dict[str, Any]) -> bool:
        from app.notifications.push import web_push_service

        return await web_push_service.send(session, user_id, payload)


class EmailService:
    async def send(self, user_id: str, payload: dict[str, Any]) -> bool:
        logger.info("email_notification_stub", user_id=user_id, title=payload.get("title"))
        return True


class SMSService:
    async def send(self, user_id: str, payload: dict[str, Any]) -> bool:
        logger.info("sms_notification_stub", user_id=user_id)
        return True


class NotificationService:
    def __init__(self) -> None:
        self.push = PushService()
        self.email = EmailService()
        self.sms = SMSService()

    async def get_preferences(self, session: AsyncSession, player_id: str) -> dict[str, Any]:
        row = (
            await session.execute(
                text("SELECT * FROM tcg_judge.notification_preferences WHERE player_id = :id"),
                {"id": player_id},
            )
        ).mappings().first()
        if row:
            return dict(row)
        return {"push_enabled": True, "email_enabled": True, "sms_enabled": False, "event_settings": {}}

    async def send(
        self,
        session: AsyncSession,
        event_type: str,
        *,
        player_ids: list[str],
        body: str | None = None,
        data: dict[str, Any] | None = None,
        channels: list[str] | None = None,
    ) -> int:
        title = EVENT_TITLES.get(event_type, event_type)
        payload = {"event_type": event_type, "title": title, "body": body, "data": data or {}}
        sent = 0
        for pid in player_ids:
            prefs = await self.get_preferences(session, pid)
            ch = channels or ["in_app"]
            if prefs.get("push_enabled") and "push" in ch:
                await self.push.send(session, pid, payload)
            if prefs.get("email_enabled") and "email" in ch:
                await self.email.send(pid, payload)
            if prefs.get("sms_enabled") and "sms" in ch:
                await self.sms.send(pid, payload)

            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.player_notifications
                      (player_id, event_type, title, body, data, channels)
                    VALUES (:pid, :evt, :title, :body, CAST(:data AS jsonb), :ch)
                    """
                ),
                {
                    "pid": pid,
                    "evt": event_type,
                    "title": title,
                    "body": body,
                    "data": json.dumps(data or {}),
                    "ch": ch,
                },
            )
            sent += 1
        return sent


notification_service = NotificationService()
