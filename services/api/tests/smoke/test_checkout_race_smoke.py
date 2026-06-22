"""Smoke opcional de race condition em staging/produção."""

from __future__ import annotations

import asyncio
import os

import aiohttp
import pytest

pytestmark = pytest.mark.smoke


@pytest.mark.asyncio
async def test_smoke_two_users_one_item():
    base_url = os.getenv("SMOKE_CHECKOUT_URL", "https://judgetcg.com.br").rstrip("/")
    token_a = os.getenv("SMOKE_TOKEN_A")
    token_b = os.getenv("SMOKE_TOKEN_B")
    cart_a = os.getenv("SMOKE_CART_A")
    cart_b = os.getenv("SMOKE_CART_B")

    if not all([token_a, token_b, cart_a, cart_b]):
        pytest.skip("Defina SMOKE_TOKEN_A/B e SMOKE_CART_A/B para smoke de concorrência.")

    async def checkout_user(token: str, cart_id: str) -> dict:
        async with aiohttp.ClientSession() as http:
            async with http.post(
                f"{base_url}/api/checkout/initiate",
                headers={"Cookie": f"sb-access-token={token}"},
                json={"cart_id": cart_id},
            ) as resp:
                body: object
                try:
                    body = await resp.json()
                except Exception:
                    body = await resp.text()
                return {"status": resp.status, "body": body}

    results = await asyncio.gather(
        checkout_user(token_a, cart_a),
        checkout_user(token_b, cart_b),
    )
    statuses = [r["status"] for r in results]

    assert 200 in statuses, f"Nenhum sucesso: {results}"
    assert any(s in (400, 423) for s in statuses), f"Nenhuma falha esperada: {results}"
