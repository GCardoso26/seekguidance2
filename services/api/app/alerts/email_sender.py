"""Envio de e-mail para alertas de preço (Resend opcional)."""

from __future__ import annotations

import os
from typing import Any

import httpx
import structlog

logger = structlog.get_logger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def render_alert_email_html(*, card_name: str, target_price: str, triggered_price: str, card_url: str) -> str:
    return f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2>Alerta de preço — {card_name}</h2>
      <p>O preço atingiu <strong>{triggered_price}</strong> (seu alvo: {target_price}).</p>
      <p><a href="{card_url}">Ver carta no Judge-TCG</a></p>
    </div>
    """


async def send_price_alert_email(
    *,
    to_email: str,
    card_name: str,
    target_price_display: str,
    triggered_price_display: str,
    card_url: str,
) -> tuple[bool, str | None]:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    from_email = os.getenv("RESEND_FROM_EMAIL", "Judge TCG <alertas@judgetcg.com.br>").strip()

    if not api_key:
        logger.info(
            "price_alert_email_stub",
            to=to_email,
            card=card_name,
            triggered=triggered_price_display,
        )
        return True, None

    payload: dict[str, Any] = {
        "from": from_email,
        "to": [to_email],
        "subject": f"Alerta de preço: {card_name}",
        "html": render_alert_email_html(
            card_name=card_name,
            target_price=target_price_display,
            triggered_price=triggered_price_display,
            card_url=card_url,
        ),
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                RESEND_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        if res.status_code >= 400:
            return False, res.text[:500]
        return True, None
    except Exception as exc:
        logger.warning("price_alert_email_failed", error=str(exc))
        return False, str(exc)
