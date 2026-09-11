"""Webhooks de transportadoras — CarrierWebhookReceived (WF-006)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
from typing import Any

import structlog
from app.core.config import get_settings
from app.infrastructure.db.session import get_session_factory
from app.marketplace import seller_fulfillment as seller_ff
from fastapi import APIRouter, HTTPException, Request

router = APIRouter(tags=["carriers"])
logger = structlog.get_logger(__name__)

MELHOR_ENVIO_WEBHOOK_PATH = "/runtime/judge/carriers/melhor-envio/webhook"


def _verify_melhor_envio_signature(raw: bytes, signature: str | None, secret: str | None) -> bool:
    """Fail-closed: sem secret configurado, rejeita (nunca aceitar unsigned).

    Melhor Envio documenta HMAC-SHA256 do body com o secret do app e envia
    ``X-ME-Signature`` em Base64 (não hex).
    """
    if not secret:
        return False
    if not signature:
        return False
    sig = signature.strip()
    if sig.lower().startswith("sha256="):
        sig = sig[7:]
    digest = hmac.new(secret.encode(), raw, hashlib.sha256).digest()
    candidates = (
        digest.hex(),
        base64.b64encode(digest).decode("ascii"),
        base64.urlsafe_b64encode(digest).decode("ascii"),
    )
    for expected in candidates:
        if len(expected) == len(sig) and hmac.compare_digest(expected, sig):
            return True
    return False


@router.api_route(MELHOR_ENVIO_WEBHOOK_PATH, methods=["GET", "HEAD"])
async def melhor_envio_webhook_probe() -> dict[str, str]:
    """Sonda de cadastro do Melhor Envio (E-WBH-0002). Eventos reais usam POST."""
    return {"status": "ok", "provider": "melhor_envio"}


@router.post(MELHOR_ENVIO_WEBHOOK_PATH)
async def melhor_envio_webhook(request: Request) -> dict[str, Any]:
    """Eventos assinados vão ao banco. Sonda de cadastro (sem X-ME-Signature) não abre Postgres."""
    settings = get_settings()
    raw = await request.body()
    signature = request.headers.get("X-ME-Signature") or request.headers.get("X-Signature")
    # Painel Melhor Envio POSTa uma sonda sem HMAC. Depends(DbSession) nisso era 500
    # com database:error (E-WBH-0002). Eventos reais sempre trazem X-ME-Signature.
    if not (signature or "").strip():
        return {"status": "ok", "provider": "melhor_envio", "probe": True}

    if not (settings.melhor_envio_webhook_secret or "").strip():
        raise HTTPException(503, "MELHOR_ENVIO_WEBHOOK_SECRET não configurado")

    if not _verify_melhor_envio_signature(raw, signature, settings.melhor_envio_webhook_secret):
        raise HTTPException(401, "Assinatura inválida")

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, "JSON inválido") from exc

    event_type = str(payload.get("event") or "unknown")
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    external_event_id = f"{event_type}:{data.get('id', '')}:{data.get('posted_at') or data.get('updated_at') or ''}"

    async with get_session_factory()() as session:
        return await seller_ff.ingest_carrier_webhook(
            session,
            provider="melhor_envio",
            event_type=event_type,
            external_event_id=external_event_id,
            payload=payload,
        )
