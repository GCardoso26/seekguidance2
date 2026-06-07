"""Testes do serviço de notificações."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from app.notifications.service import NotificationService


@pytest.mark.asyncio
async def test_send_respects_disabled_push(monkeypatch):
    svc = NotificationService()
    svc.push.send = AsyncMock(return_value=True)
    svc.email.send = AsyncMock(return_value=True)

    session = AsyncMock()
    session.execute = AsyncMock(
        return_value=MagicMock(
            mappings=MagicMock(
                return_value=MagicMock(
                    first=MagicMock(return_value={"push_enabled": False, "email_enabled": True, "sms_enabled": False})
                )
            )
        )
    )

    svc.push.send = AsyncMock(return_value=True)

    count = await svc.send(
        session,
        "round:starting",
        player_ids=["user-1"],
        body="Rodada 3",
        channels=["push", "email"],
    )
    assert count == 1
    svc.push.send.assert_not_called()
    svc.email.send.assert_called_once()
