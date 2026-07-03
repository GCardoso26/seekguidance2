"""Adapter Melhor Envio — fluxo cart → checkout → generate → print."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import structlog

from app.core.config import get_settings
from app.integrations.melhor_envio.client import MelhorEnvioClient, MelhorEnvioError

logger = structlog.get_logger(__name__)


@dataclass
class MelhorEnvioLabelResult:
    external_shipment_id: str
    external_protocol: str | None
    cart_item_id: str | None
    tracking_code: str | None
    label_url: str | None
    tracking_url: str | None
    raw: dict[str, Any]


def _parse_address(raw: dict[str, Any] | None, *, fallback_name: str) -> dict[str, Any]:
    if not raw:
        raise MelhorEnvioError("Endereço ausente para etiqueta Melhor Envio")
    return {
        "name": str(raw.get("name") or fallback_name),
        "phone": str(raw.get("phone") or "11999999999"),
        "email": str(raw.get("email") or "contato@judgetcg.com.br"),
        "document": str(raw.get("document") or raw.get("cpf") or ""),
        "address": str(raw.get("address") or raw.get("street") or ""),
        "number": str(raw.get("number") or "S/N"),
        "complement": str(raw.get("complement") or ""),
        "district": str(raw.get("district") or raw.get("neighborhood") or ""),
        "city": str(raw.get("city") or ""),
        "state_abbr": str(raw.get("state_abbr") or raw.get("state") or "")[:2].upper(),
        "postal_code": str(raw.get("postal_code") or raw.get("zip") or "").replace("-", ""),
    }


def _build_cart_payload(
    *,
    service_id: int,
    from_address: dict[str, Any],
    to_address: dict[str, Any],
    products: list[dict[str, Any]],
    insurance_value: float,
    volumes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    vols = volumes or [{"height": 4, "width": 16, "length": 24, "weight": 0.3}]
    return {
        "service": service_id,
        "from": from_address,
        "to": to_address,
        "products": products,
        "volumes": vols,
        "options": {
            "insurance_value": insurance_value,
            "receipt": False,
            "own_hand": False,
            "reverse": False,
            "non_commercial": True,
        },
    }


async def create_label_for_order(
    *,
    order: dict[str, Any],
    store: dict[str, Any],
    service_id: int | None = None,
) -> MelhorEnvioLabelResult:
    settings = get_settings()
    token = (
        (store.get("shipping_settings") or {}).get("melhor_envio_token")
        if isinstance(store.get("shipping_settings"), dict)
        else None
    ) or settings.melhor_envio_token
    if not token:
        raise MelhorEnvioError("MELHOR_ENVIO_TOKEN não configurado")

    from_raw = (store.get("shipping_settings") or {}).get("from_address")
    if isinstance(from_raw, str):
        from_raw = json.loads(from_raw)
    if not from_raw and settings.melhor_envio_from_address:
        from_raw = json.loads(settings.melhor_envio_from_address)

    shipping = order.get("shipping_address")
    if isinstance(shipping, str):
        shipping = json.loads(shipping)

    sid = service_id or int(settings.melhor_envio_default_service_id or 1)
    insurance = max(1.0, float(order.get("total_cents") or 0) / 100.0)

    products = [
        {
            "name": "Pedido JudgeTCG",
            "quantity": 1,
            "unitary_value": insurance,
        }
    ]

    cart_payload = _build_cart_payload(
        service_id=sid,
        from_address=_parse_address(from_raw, fallback_name=str(store.get("name") or "Loja")),
        to_address=_parse_address(shipping, fallback_name="Comprador"),
        products=products,
        insurance_value=insurance,
    )

    client = MelhorEnvioClient(token=token, sandbox=settings.melhor_envio_sandbox)
    cart_item = await client.add_to_cart(cart_payload)
    cart_id = str(cart_item.get("id") or cart_item.get("order_id") or "")
    if not cart_id:
        raise MelhorEnvioError("Melhor Envio não retornou ID do carrinho")

    await client.checkout([cart_id])
    await client.generate_labels([cart_id])
    print_data = await client.print_labels([cart_id], mode="public")

    label_url = None
    if isinstance(print_data, dict):
        label_url = print_data.get("url") or print_data.get("link")
        if not label_url and print_data.get("urls"):
            urls = print_data["urls"]
            label_url = urls[0] if isinstance(urls, list) and urls else None

    order_detail = await client.get_order(cart_id)
    tracking = order_detail.get("tracking") or order_detail.get("self_tracking")
    tracking_url = order_detail.get("tracking_url")

    return MelhorEnvioLabelResult(
        external_shipment_id=cart_id,
        external_protocol=str(order_detail.get("protocol") or "") or None,
        cart_item_id=cart_id,
        tracking_code=str(tracking) if tracking else None,
        label_url=str(label_url) if label_url else None,
        tracking_url=str(tracking_url) if tracking_url else None,
        raw={"cart": cart_item, "print": print_data, "order": order_detail},
    )
