"""Abstração de gateway PIX (OpenPix, Asaas ou modo manual)."""

from __future__ import annotations

import hashlib
import hmac
import json
from abc import ABC, abstractmethod
from typing import Any

import httpx
import structlog

from app.core.config import Settings

logger = structlog.get_logger(__name__)


class PixGateway(ABC):
    @abstractmethod
    async def create_charge(
        self,
        *,
        txid: str,
        amount_cents: int,
        pix_key: str,
        pix_key_type: str | None,
        description: str,
        expires_in_seconds: int,
    ) -> dict[str, Any]:
        """Retorna qr_code, copy_payload, gateway_charge_id."""

    @abstractmethod
    def verify_webhook(self, payload: bytes, headers: dict[str, str]) -> bool:
        """Valida assinatura HMAC do webhook."""

    @abstractmethod
    def parse_webhook(self, payload: dict[str, Any]) -> str | None:
        """Extrai txid/correlationID do payload do gateway."""


class ManualPixGateway(PixGateway):
    """Sem PSP — lojista confirma manualmente ou via endpoint interno."""

    async def create_charge(
        self,
        *,
        txid: str,
        amount_cents: int,
        pix_key: str,
        pix_key_type: str | None,
        description: str,
        expires_in_seconds: int,
    ) -> dict[str, Any]:
        return {
            "gateway_provider": "manual",
            "gateway_charge_id": None,
            "qr_code": None,
            "copy_payload": None,
        }

    def verify_webhook(self, payload: bytes, headers: dict[str, str]) -> bool:
        return True

    def parse_webhook(self, payload: dict[str, Any]) -> str | None:
        txid = payload.get("txid") or payload.get("correlationID")
        return str(txid) if txid else None


class OpenPixGateway(PixGateway):
    BASE_URL = "https://api.openpix.com.br/api/v1"

    def __init__(self, api_key: str, webhook_secret: str | None = None) -> None:
        self.api_key = api_key
        self.webhook_secret = webhook_secret or ""

    async def create_charge(
        self,
        *,
        txid: str,
        amount_cents: int,
        pix_key: str,
        pix_key_type: str | None,
        description: str,
        expires_in_seconds: int,
    ) -> dict[str, Any]:
        body = {
            "correlationID": txid,
            "value": amount_cents,
            "comment": description[:140],
            "expiresIn": expires_in_seconds,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                f"{self.BASE_URL}/charge",
                headers={"Authorization": self.api_key, "Content-Type": "application/json"},
                json=body,
            )
            res.raise_for_status()
            data = res.json()
        charge = data.get("charge") or data
        br_code = charge.get("brCode") or charge.get("qrCodeImage")
        return {
            "gateway_provider": "openpix",
            "gateway_charge_id": str(charge.get("transactionID") or charge.get("id") or txid),
            "qr_code": charge.get("qrCodeImage"),
            "copy_payload": charge.get("brCode") or br_code,
        }

    def verify_webhook(self, payload: bytes, headers: dict[str, str]) -> bool:
        if not self.webhook_secret:
            logger.warning("openpix_webhook_no_secret")
            return False
        signature = headers.get("x-openpix-signature") or headers.get("X-OpenPix-Signature") or ""
        expected = hmac.new(self.webhook_secret.encode(), payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected)

    def parse_webhook(self, payload: dict[str, Any]) -> str | None:
        charge = payload.get("charge") or payload
        txid = charge.get("correlationID") or payload.get("correlationID")
        status = (charge.get("status") or payload.get("status") or "").upper()
        if status and status not in {"COMPLETED", "PAID", "CONFIRMED"}:
            return None
        return str(txid) if txid else None


class AsaasGateway(PixGateway):
    """Stub Asaas — ativa quando ASAAS_API_KEY estiver configurada."""

    def __init__(self, api_key: str, webhook_token: str | None = None) -> None:
        self.api_key = api_key
        self.webhook_token = webhook_token or ""

    async def create_charge(
        self,
        *,
        txid: str,
        amount_cents: int,
        pix_key: str,
        pix_key_type: str | None,
        description: str,
        expires_in_seconds: int,
    ) -> dict[str, Any]:
        logger.info("asaas_pix_stub", txid=txid, amount_cents=amount_cents)
        return {
            "gateway_provider": "asaas",
            "gateway_charge_id": txid,
            "qr_code": None,
            "copy_payload": None,
        }

    def verify_webhook(self, payload: bytes, headers: dict[str, str]) -> bool:
        token = headers.get("asaas-access-token") or headers.get("Asaas-Access-Token") or ""
        return not self.webhook_token or hmac.compare_digest(token, self.webhook_token)

    def parse_webhook(self, payload: dict[str, Any]) -> str | None:
        payment = payload.get("payment") or payload
        if (payment.get("status") or "").upper() not in {"RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"}:
            return None
        ext_ref = payment.get("externalReference") or payment.get("id")
        return str(ext_ref) if ext_ref else None


def get_pix_gateway(settings: Settings) -> PixGateway:
    if settings.openpix_api_key:
        return OpenPixGateway(settings.openpix_api_key, settings.openpix_webhook_secret)
    if settings.asaas_api_key:
        return AsaasGateway(settings.asaas_api_key, settings.asaas_webhook_token)
    return ManualPixGateway()


def parse_json_body(raw: bytes) -> dict[str, Any]:
    try:
        data = json.loads(raw.decode())
        return data if isinstance(data, dict) else {"data": data}
    except json.JSONDecodeError:
        return {}
