"""E2E: hooks e pré-condição de API viva (uma verificação por sessão de pytest)."""

from __future__ import annotations

import os

import httpx
import pytest

# Com `docker compose`, Redis expõe 6380 no host. Opt-in para não quebrar quem usa 6379 local.
if os.getenv("RUN_E2E") == "1" and os.getenv("E2E_USE_COMPOSE_REDIS") == "1":
    os.environ["REDIS_URL"] = os.getenv("E2E_REDIS_URL", "redis://127.0.0.1:6380/0")

_api_live: bool | None = None
_api_skip_reason: str | None = None


def pytest_runtest_setup(item: pytest.Item) -> None:
    """Garante que `RUN_E2E=1` não gera dezenas de timeouts se a API não estiver de pé."""
    global _api_live, _api_skip_reason
    if item.get_closest_marker("e2e") is None:
        return
    if os.getenv("RUN_E2E") != "1":
        return
    if _api_live is True:
        return
    if _api_live is False:
        pytest.skip(_api_skip_reason or "E2E: API indisponível.")
    base = os.getenv("E2E_API_BASE", "http://127.0.0.1:8000").rstrip("/")
    try:
        h = httpx.get(f"{base}/v1/health", timeout=5.0)
        g = httpx.get(f"{base}/v1/games", timeout=10.0)
    except httpx.RequestError as exc:
        _api_live = False
        _api_skip_reason = f"E2E: não foi possível contactar {base}: {exc}"
        pytest.skip(_api_skip_reason)
    if h.status_code != 200 or g.status_code != 200:
        _api_live = False
        _api_skip_reason = f"E2E: health={h.status_code} games={g.status_code} em {base}"
        pytest.skip(_api_skip_reason)
    _api_live = True
