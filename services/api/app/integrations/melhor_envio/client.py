"""Cliente HTTP Melhor Envio API v2."""

from __future__ import annotations

from typing import Any

import httpx
import structlog

logger = structlog.get_logger(__name__)

SANDBOX_BASE = "https://sandbox.melhorenvio.com.br"
PRODUCTION_BASE = "https://melhorenvio.com.br"


class MelhorEnvioError(Exception):
    def __init__(self, message: str, *, status_code: int | None = None, body: Any = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.body = body


class MelhorEnvioClient:
    def __init__(
        self,
        *,
        token: str,
        sandbox: bool = True,
        user_agent: str = "JudgeTCG (contato@judgetcg.com.br)",
        timeout: float = 30.0,
    ) -> None:
        self._token = token
        self._base = SANDBOX_BASE if sandbox else PRODUCTION_BASE
        self._user_agent = user_agent
        self._timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": self._user_agent,
        }

    async def _request(self, method: str, path: str, *, json_body: dict[str, Any] | None = None) -> Any:
        url = f"{self._base}{path}"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.request(method, url, headers=self._headers(), json=json_body)
        if resp.status_code >= 400:
            logger.warning("melhor_envio_api_error", path=path, status=resp.status_code, body=resp.text[:500])
            raise MelhorEnvioError(
                f"Melhor Envio {path} failed: {resp.status_code}",
                status_code=resp.status_code,
                body=resp.text,
            )
        if not resp.content:
            return {}
        return resp.json()

    async def add_to_cart(self, payload: dict[str, Any]) -> dict[str, Any]:
        data = await self._request("POST", "/api/v2/me/cart", json_body=payload)
        if isinstance(data, dict):
            return data
        raise MelhorEnvioError("Unexpected cart response")

    async def checkout(self, order_ids: list[str]) -> dict[str, Any]:
        return await self._request(
            "POST",
            "/api/v2/me/shipment/checkout",
            json_body={"orders": order_ids},
        )

    async def generate_labels(self, order_ids: list[str]) -> dict[str, Any]:
        return await self._request(
            "POST",
            "/api/v2/me/shipment/generate",
            json_body={"orders": order_ids},
        )

    async def print_labels(self, order_ids: list[str], *, mode: str = "public") -> dict[str, Any]:
        return await self._request(
            "POST",
            "/api/v2/me/shipment/print",
            json_body={"mode": mode, "orders": order_ids},
        )

    async def get_order(self, order_id: str) -> dict[str, Any]:
        return await self._request("GET", f"/api/v2/me/orders/{order_id}")

    async def get_me(self) -> dict[str, Any]:
        """Valida token — GET /api/v2/me."""
        return await self._request("GET", "/api/v2/me")
