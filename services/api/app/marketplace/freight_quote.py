"""FreightQuote Service — cotações Melhor Envio + fallback heurístico (Sprint 15)."""

from __future__ import annotations

import json
import os
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.integrations.melhor_envio.client import MelhorEnvioClient, MelhorEnvioError

logger = structlog.get_logger(__name__)


def shipping_v2_enabled() -> bool:
    return os.getenv("SHIPPING_V2_ENABLED", "false").lower() in {"1", "true", "yes"}


def _heuristic_quotes(*, store_count: int, item_count: int) -> list[dict[str, Any]]:
    base = 1200 + max(0, item_count - 1) * 150
    return [
        {
            "id": "economy",
            "carrier": "heuristic",
            "service": "Econômico",
            "price_cents": base,
            "delivery_days": 5,
            "pickup_available": False,
            "score": 0.6,
        },
        {
            "id": "express",
            "carrier": "heuristic",
            "service": "Rápido",
            "price_cents": base + 800,
            "delivery_days": 3,
            "pickup_available": False,
            "score": 0.75,
        },
        {
            "id": "pickup",
            "carrier": "heuristic",
            "service": "Retirada em loja",
            "price_cents": 0,
            "delivery_days": 0,
            "pickup_available": True,
            "score": 0.9 if store_count == 1 else 0.5,
        },
    ]


async def _melhor_envio_quotes(
    *,
    from_postal: str,
    to_postal: str,
    products: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    settings = get_settings()
    token = settings.melhor_envio_token
    if not token:
        return []
    from_raw = {}
    if settings.melhor_envio_from_address:
        from_raw = json.loads(settings.melhor_envio_from_address)
    payload = {
        "from": {"postal_code": from_postal or from_raw.get("postal_code", "01310100")},
        "to": {"postal_code": to_postal.replace("-", "")},
        "products": products
        or [{"id": "1", "width": 16, "height": 4, "length": 24, "weight": 0.3, "insurance_value": 10, "quantity": 1}],
    }
    client = MelhorEnvioClient(token=token, sandbox=settings.melhor_envio_sandbox)
    try:
        data = await client.calculate_shipping(payload)
    except MelhorEnvioError as exc:
        logger.warning("freight_quote_melhor_envio_failed", error=str(exc))
        return []
    quotes: list[dict[str, Any]] = []
    rows = data if isinstance(data, list) else data.get("data") or data.get("quotes") or []
    for row in rows:
        if not isinstance(row, dict):
            continue
        price = row.get("price") or row.get("custom_price") or 0
        quotes.append(
            {
                "id": str(row.get("id") or row.get("service") or ""),
                "carrier": str(row.get("company", {}).get("name") if isinstance(row.get("company"), dict) else row.get("company") or "melhor_envio"),
                "service": str(row.get("name") or row.get("service_name") or "Frete"),
                "price_cents": int(float(price) * 100),
                "delivery_days": int(row.get("delivery_time") or row.get("custom_delivery_time") or 5),
                "pickup_available": bool(row.get("pickup", False)),
                "score": 0.85,
            }
        )
    return quotes


async def quote_freight(
    session: AsyncSession,
    *,
    user_id: str,
    destination_postal_code: str,
    cart_items: list[dict[str, Any]],
    from_postal_code: str | None = None,
) -> dict[str, Any]:
    store_ids = {str(i.get("store_id")) for i in cart_items if i.get("store_id")}
    item_count = sum(int(i.get("quantity") or 1) for i in cart_items)
    products = [
        {
            "id": str(i.get("product_id") or idx),
            "width": 16,
            "height": 4,
            "length": 24,
            "weight": 0.25,
            "insurance_value": max(1, int(i.get("price_cents") or 0) / 100),
            "quantity": int(i.get("quantity") or 1),
        }
        for idx, i in enumerate(cart_items)
    ]

    quotes: list[dict[str, Any]] = []
    source = "heuristic"
    if shipping_v2_enabled() and destination_postal_code:
        quotes = await _melhor_envio_quotes(
            from_postal=from_postal_code or "01310100",
            to_postal=destination_postal_code,
            products=products,
        )
        if quotes:
            source = "melhor_envio"

    if not quotes:
        quotes = _heuristic_quotes(store_count=len(store_ids), item_count=item_count)
        source = "heuristic"

    best_price = min(quotes, key=lambda q: q["price_cents"])
    best_time = min(quotes, key=lambda q: q["delivery_days"])
    best_value = max(quotes, key=lambda q: q.get("score", 0))

    payload = {
        "quotes": quotes,
        "recommended": {
            "lowest_price": best_price,
            "fastest": best_time,
            "best_value": best_value,
        },
        "meta": {
            "store_count": len(store_ids),
            "item_count": item_count,
            "source": source,
            "shipping_v2": shipping_v2_enabled(),
        },
    }

    expires = datetime.now(UTC) + timedelta(minutes=15)
    try:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.shipping_quote_read_model
                  (user_id, destination_postal_code, payload, source, expires_at)
                VALUES (:uid, :cep, CAST(:payload AS jsonb), :source, :exp)
                """
            ),
            {
                "uid": user_id,
                "cep": destination_postal_code or "",
                "payload": json.dumps(payload),
                "source": source,
                "exp": expires,
            },
        )
        await session.commit()
    except Exception:
        pass

    return payload
