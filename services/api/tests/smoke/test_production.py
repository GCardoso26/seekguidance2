"""Smoke tests de produção — executar após deploy.

Uso:
  PRODUCTION_API_URL=https://api.judgetcg.com.br pytest tests/smoke/test_production.py -v
"""

from __future__ import annotations

import os

import pytest
import requests

API_URL = os.getenv("PRODUCTION_API_URL", "").rstrip("/")
FRONTEND_URL = os.getenv("PRODUCTION_FRONTEND_URL", "https://judgetcg.com.br").rstrip("/")
TIMEOUT = int(os.getenv("SMOKE_TIMEOUT", "15"))

# Fallback: API via proxy do frontend (BFF Next.js)
API_CANDIDATES = [u for u in [API_URL, f"{FRONTEND_URL}/api/proxy"] if u]


def _get_working_api() -> str | None:
    for base in API_CANDIDATES:
        try:
            r = requests.get(f"{base}/v1/health", timeout=TIMEOUT)
            if r.status_code == 200:
                return base
            r2 = requests.get(f"{base}/health", timeout=TIMEOUT)
            if r2.status_code == 200:
                return base
        except requests.RequestException:
            continue
    return None


@pytest.fixture(scope="module")
def api() -> str:
    working = _get_working_api()
    if not working:
        pytest.skip("API de produção indisponível — defina PRODUCTION_API_URL")
    return working


def test_health_check(api: str) -> None:
    r = requests.get(f"{api}/v1/health", timeout=TIMEOUT)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in {"healthy", "degraded", "ok"}
    assert "services" in body
    assert body["services"]["database"] in {"ok", "error"}


def test_runtime_health(api: str) -> None:
    r = requests.get(f"{api}/health", timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json().get("status") in {"ok", "healthy", "degraded"}


def test_judge_health(api: str) -> None:
    r = requests.get(f"{api}/runtime/judge/health", timeout=TIMEOUT)
    assert r.status_code == 200


def test_frontend_home() -> None:
    r = requests.get(FRONTEND_URL, timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200


def test_frontend_health_bff() -> None:
    r = requests.get(f"{FRONTEND_URL}/api/health", timeout=TIMEOUT)
    assert r.status_code in {200, 503}
    body = r.json()
    assert "services" in body


def test_marketplace_public(api: str) -> None:
    r = requests.get(
        f"{api}/runtime/judge/marketplace/shop/products",
        timeout=TIMEOUT,
        params={"limit": 1},
    )
    assert r.status_code in {200, 404, 422}


@pytest.mark.skip(reason="Requer credenciais de teste — habilitar com SMOKE_AUTH_TOKEN")
def test_checkout_with_coupon_authenticated() -> None:
    """Fluxo completo: carrinho → cupom → PIX com desconto."""
    pass
