from __future__ import annotations

from typing import Any

from .client import RuntimeClient


class ReplayClient(RuntimeClient):
    def list_replays(self, tenant_id: str | None = None) -> dict[str, Any]:
        path = "/runtime/replay"
        if tenant_id:
            path += f"?tenant_id={tenant_id}"
        return self._request("GET", path)

    def append(self, scope: str, payload: dict[str, Any], *, tenant_id: str = "default") -> dict[str, Any]:
        return self._request(
            "POST",
            "/runtime/replay",
            {"scope": scope, "payload": payload, "tenant_id": tenant_id},
        )
