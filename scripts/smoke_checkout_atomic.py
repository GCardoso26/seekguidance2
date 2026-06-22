#!/usr/bin/env python3
"""Smoke pós-deploy: checkout atômico (expire + concorrência parcial)."""

from __future__ import annotations

import asyncio
import os
import sys
from typing import Any

import httpx

API = os.getenv("SMOKE_API_URL", "https://seekguidance.onrender.com").rstrip("/")
FRONTEND = os.getenv("SMOKE_FRONTEND_URL", "https://judgetcg.com.br").rstrip("/")
TIMEOUT = float(os.getenv("SMOKE_TIMEOUT", "15"))
USER_A = os.getenv("SMOKE_CHECKOUT_USER_A", "")
USER_B = os.getenv("SMOKE_CHECKOUT_USER_B", "")


def ok(msg: str) -> None:
    print(f"  OK  {msg}")


def fail(msg: str) -> None:
    print(f"  FAIL {msg}")


async def test_expire_stale(client: httpx.AsyncClient) -> bool:
    r = await client.post(f"{API}/runtime/judge/checkout/expire-stale")
    if r.status_code != 200:
        fail(f"expire-stale HTTP {r.status_code}")
        return False
    data = r.json()
    if "expired" not in data:
        fail("expire-stale sem campo 'expired'")
        return False
    ok(f"expire-stale liberou {data['expired']} sessão(ões)")
    return True


async def test_initiate_requires_auth(client: httpx.AsyncClient) -> bool:
    r = await client.post(f"{API}/runtime/judge/checkout/initiate", json={})
    if r.status_code not in (401, 403, 422):
        fail(f"initiate sem auth deveria falhar, obteve {r.status_code}")
        return False
    ok("initiate exige autenticação")
    return True


async def test_concurrent_initiate(client: httpx.AsyncClient) -> bool:
    if not USER_A or not USER_B:
        ok("concorrência ignorada (defina SMOKE_CHECKOUT_USER_A e SMOKE_CHECKOUT_USER_B)")
        return True

    async def initiate(user_id: str) -> tuple[str, int, str]:
        try:
            r = await client.post(
                f"{API}/runtime/judge/checkout/initiate",
                json={},
                headers={"X-Judge-User-Id": user_id},
            )
            return user_id, r.status_code, r.text[:200]
        except Exception as exc:
            return user_id, 0, str(exc)

    results = await asyncio.gather(initiate(USER_A), initiate(USER_B))
    statuses = [s for _, s, _ in results]
    successes = sum(1 for s in statuses if s == 200)
    locked = sum(1 for s in statuses if s == 423)

    if successes + locked < 1:
        fail(f"concorrência sem resposta útil: {results}")
        return False

    ok(f"concorrência: sucessos={successes}, locked={locked}, outros={len(statuses) - successes - locked}")
    return True


async def test_bff_cron(client: httpx.AsyncClient) -> bool:
    secret = os.getenv("CRON_SECRET", "")
    headers = {"Authorization": f"Bearer {secret}"} if secret else {}
    r = await client.get(f"{FRONTEND}/api/cron/expire-checkouts", headers=headers)
    if secret:
        if r.status_code != 200:
            fail(f"BFF cron HTTP {r.status_code}")
            return False
        ok("BFF cron expire-checkouts")
        return True
    # sem secret: 401 é esperado em produção
    if r.status_code == 401:
        ok("BFF cron protegido (401 sem CRON_SECRET)")
        return True
    if r.status_code == 404:
        ok("BFF cron opcional (404 — expiração via API/GitHub Actions)")
        return True
    if r.status_code == 200:
        ok("BFF cron expire-checkouts (sem secret)")
        return True
    fail(f"BFF cron HTTP inesperado {r.status_code}")
    return False


async def main() -> int:
    print(f"\nCheckout Atomic Smoke — API {API}\n")
    passed = 0
    total = 0

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for fn in (test_expire_stale, test_initiate_requires_auth, test_concurrent_initiate, test_bff_cron):
            total += 1
            if await fn(client):
                passed += 1

    print(f"\n{passed}/{total} testes passaram\n")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
