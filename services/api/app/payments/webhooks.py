"""Verificação de assinatura de webhooks de pagamento."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException

import stripe


def verify_stripe_webhook(payload: bytes, sig_header: str | None, secret: str) -> dict[str, Any]:
    """Valida Stripe-Signature antes de processar qualquer evento."""
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature")
    if not secret:
        raise HTTPException(status_code=503, detail="Stripe webhook secret não configurado")
    try:
        return stripe.Webhook.construct_event(payload, sig_header, secret)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc
