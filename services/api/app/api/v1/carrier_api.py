"""Webhooks de transportadoras — CarrierWebhookReceived (WF-006)."""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any

import structlog
from app.api.deps import DbSession
from app.core.config import get_settings
from app.marketplace import seller_fulfillment as seller_ff
from fastapi import APIRouter, HTTPException, Request

router = APIRouter(tags=["carriers"])
logger = structlog.get_logger(__name__)


def _verify_melhor_envio_signature(raw: bytes, signature: str | None, secret: str | None) -> bool:
    if not secret:
        return True
    if not signature:
        return False
    expected = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature.replace("sha256=", ""))


@router.post("/runtime/judge/carriers/melhor-envio/webhook")
async def melhor_envio_webhook(request: Request, session: DbSession) -> dict[str, Any]:
    """Recebe eventos Melhor Envio — processamento assíncrono via Background Job."""
    settings = get_settings()
    raw = await request.body()
    signature = request.headers.get("X-ME-Signature") or request.headers.get("X-Signature")

    if not _verify_melhor_envio_signature(raw, signature, settings.melhor_envio_webhook_secret):
        raise HTTPException(401, "Assinatura inválida")

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, "JSON inválido") from exc

    event_type = str(payload.get("event") or "unknown")
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    external_event_id = f"{event_type}:{data.get('id', '')}:{data.get('posted_at') or data.get('updated_at') or ''}"

    return await seller_ff.ingest_carrier_webhook(
        session,
        provider="melhor_envio",
        event_type=event_type,
        external_event_id=external_event_id,
        payload=payload,
    )
