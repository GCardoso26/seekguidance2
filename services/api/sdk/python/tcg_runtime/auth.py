from __future__ import annotations

from typing import Any

from .client import RuntimeClient


class AuthClient(RuntimeClient):
    def login(self, username: str, password: str) -> dict[str, Any]:
        out = self._request("POST", "/auth/login", {"username": username, "password": password})
        tok = out.get("tokens", {})
        if tok.get("access_token"):
            self.token = tok["access_token"]
        return out

    def refresh(self, refresh_token: str) -> dict[str, Any]:
        out = self._request("POST", "/auth/refresh", {"refresh_token": refresh_token})
        tok = out.get("tokens", {})
        if tok.get("access_token"):
            self.token = tok["access_token"]
        return out
