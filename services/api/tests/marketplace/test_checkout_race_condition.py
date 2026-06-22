"""Testes de concorrência real para checkout atômico (SELECT FOR UPDATE NOWAIT)."""

from __future__ import annotations

import asyncio
import time
from typing import Any

import pytest
from fastapi import HTTPException
from sqlalchemy import text

from app.marketplace import checkout_atomic

pytestmark = [pytest.mark.asyncio(loop_scope="session"), pytest.mark.race]


def _cart_item(product_id: str, quantity: int = 1, price_cents: int = 4500) -> dict[str, Any]:
    return {
        "product_id": product_id,
        "quantity": quantity,
        "price_cents": price_cents,
        "name": "Race item",
    }


async def _initiate(user_id: str, cart_id: str, factory) -> dict[str, Any]:
    async with factory() as session:
        try:
            result = await checkout_atomic.initiate_checkout(
                session,
                user_id,
                cart_id=cart_id,
            )
            return {
                "status": "success",
                "session_id": result["session_id"],
                "user_id": user_id,
            }
        except HTTPException as exc:
            return {
                "status": "error",
                "code": exc.status_code,
                "detail": str(exc.detail),
                "user_id": user_id,
            }
        except Exception as exc:
            return {
                "status": "error",
                "code": 0,
                "detail": str(exc),
                "user_id": user_id,
            }


def _is_expected_race_failure(result: dict[str, Any]) -> bool:
    if result.get("status") != "error":
        return False
    code = int(result.get("code") or 0)
    detail = str(result.get("detail", "")).lower()
    if code == 423:
        return True
    if code == 400 and ("disponível" in detail or "insuficiente" in detail or "esgotado" in detail):
        return True
    return "locked" in detail or "processado por outro" in detail


class TestCheckoutRaceConditions:
    async def test_two_users_one_item_stock_one(self, race):
        product_id = await race.create_product(
            await race.new_session(),
            stock=1,
            reserved_stock=0,
        )
        setup = await race.new_session()
        user_a, cart_a = await race.create_user_with_cart(setup, [_cart_item(product_id)])
        user_b, cart_b = await race.create_user_with_cart(setup, [_cart_item(product_id)])

        results = await asyncio.gather(
            _initiate(user_a, cart_a, race.factory),
            _initiate(user_b, cart_b, race.factory),
        )

        successes = [r for r in results if r["status"] == "success"]
        errors = [r for r in results if r["status"] == "error"]

        assert len(successes) == 1, f"Esperado 1 sucesso: {results}"
        assert len(errors) == 1, f"Esperado 1 erro: {results}"
        assert _is_expected_race_failure(errors[0]), errors[0]

        race.session_ids.append(successes[0]["session_id"])
        verify = await race.new_session()
        product = await race.get_product(verify, product_id)
        assert product["stock"] == 1
        assert product["reserved_stock"] == 1

        active = await race.count_active_sessions(verify, [user_a, user_b])
        assert active == 1

    async def test_two_users_one_item_with_listing_sync(self, race):
        """Quando há card_listing ligada, reserved_quantity acompanha reserved_stock."""
        setup = await race.new_session()
        product_id = await race.create_product(setup, stock=1, with_listing=True)
        user_a, cart_a = await race.create_user_with_cart(setup, [_cart_item(product_id)])
        user_b, cart_b = await race.create_user_with_cart(setup, [_cart_item(product_id)])

        results = await asyncio.gather(
            _initiate(user_a, cart_a, race.factory),
            _initiate(user_b, cart_b, race.factory),
        )
        successes = [r for r in results if r["status"] == "success"]
        assert len(successes) == 1
        race.session_ids.append(successes[0]["session_id"])

        verify = await race.new_session()
        listing = (
            await verify.execute(
                text(
                    """
                    SELECT reserved_quantity FROM tcg_judge.card_listings
                    WHERE store_product_id = :pid
                    """
                ),
                {"pid": product_id},
            )
        ).mappings().first()
        if listing is not None:
            assert int(listing["reserved_quantity"]) == 1

    async def test_two_users_one_item_nowait_is_fast(self, race):
        """Segundo checkout deve falhar rápido (NOWAIT — sem esperar timeout longo)."""
        product_id = await race.create_product(await race.new_session(), stock=1)
        setup = await race.new_session()
        user_a, cart_a = await race.create_user_with_cart(setup, [_cart_item(product_id)])
        user_b, cart_b = await race.create_user_with_cart(setup, [_cart_item(product_id)])

        barrier = asyncio.Barrier(2)
        timings: dict[str, float] = {}

        async def checkout_timed(user_id: str, cart_id: str, label: str) -> dict[str, Any]:
            await barrier.wait()
            start = time.perf_counter()
            result = await _initiate(user_id, cart_id, race.factory)
            timings[label] = time.perf_counter() - start
            return result

        results = await asyncio.gather(
            checkout_timed(user_a, cart_a, "A"),
            checkout_timed(user_b, cart_b, "B"),
        )
        errors = [r for r in results if r["status"] == "error"]
        assert len(errors) == 1
        err_uid = errors[0]["user_id"]
        err_label = "A" if err_uid == user_a else "B"
        assert timings[err_label] < 2.0, f"Falha demorou demais: {timings}"

        for r in results:
            if r["status"] == "success":
                race.session_ids.append(r["session_id"])

    async def test_three_users_two_items(self, race):
        product_id = await race.create_product(await race.new_session(), stock=2, price_cents=1500000)
        setup = await race.new_session()
        users: list[tuple[str, str]] = []
        for _ in range(3):
            uid, cid = await race.create_user_with_cart(setup, [_cart_item(product_id, price_cents=1500000)])
            users.append((uid, cid))

        results = await asyncio.gather(
            *[_initiate(uid, cid, race.factory) for uid, cid in users]
        )

        successes = [r for r in results if r["status"] == "success"]
        errors = [r for r in results if r["status"] == "error"]

        assert len(successes) == 2, results
        assert len(errors) == 1, results
        assert _is_expected_race_failure(errors[0])

        for s in successes:
            race.session_ids.append(s["session_id"])

        verify = await race.new_session()
        product = await race.get_product(verify, product_id)
        assert product["reserved_stock"] == 2

    async def test_multi_item_cart_one_item_race(self, race):
        setup = await race.new_session()
        product_a = await race.create_product(setup, stock=100, price_cents=50, name="Mountain")
        product_b = await race.create_product(setup, stock=1, price_cents=500000, name="Mox Pearl")

        user_a, cart_a = await race.create_user_with_cart(
            setup,
            [_cart_item(product_a, price_cents=50), _cart_item(product_b, price_cents=500000)],
        )
        user_b, cart_b = await race.create_user_with_cart(setup, [_cart_item(product_b, price_cents=500000)])

        async def checkout_a():
            return await _initiate(user_a, cart_a, race.factory)

        async def checkout_b():
            await asyncio.sleep(0.02)
            return await _initiate(user_b, cart_b, race.factory)

        results = await asyncio.gather(checkout_a(), checkout_b())
        successes = [r for r in results if r["status"] == "success"]
        errors = [r for r in results if r["status"] == "error"]

        assert len(successes) == 1, results
        assert len(errors) == 1, results

        verify = await race.new_session()
        pa = await race.get_product(verify, product_a)
        pb = await race.get_product(verify, product_b)

        winner = successes[0]["user_id"]
        if winner == user_a:
            assert pa["reserved_stock"] == 1
            assert pb["reserved_stock"] == 1
        else:
            assert pa["reserved_stock"] == 0
            assert pb["reserved_stock"] == 1

        race.session_ids.append(successes[0]["session_id"])

    async def test_expiration_releases_stock(self, race):
        setup = await race.new_session()
        product_id = await race.create_product(setup, stock=1, price_cents=1200)
        user_a, cart_a = await race.create_user_with_cart(setup, [_cart_item(product_id, price_cents=1200)])
        user_b, cart_b = await race.create_user_with_cart(setup, [_cart_item(product_id, price_cents=1200)])

        session_a = await checkout_atomic.initiate_checkout(setup, user_a, cart_id=cart_a)
        race.session_ids.append(session_a["session_id"])

        product = await race.get_product(setup, product_id)
        assert product["reserved_stock"] == 1

        await setup.execute(
            text(
                """
                UPDATE tcg_judge.checkout_sessions
                SET expires_at = NOW() - INTERVAL '1 minute'
                WHERE id = :id
                """
            ),
            {"id": session_a["session_id"]},
        )
        await setup.commit()

        expired = await checkout_atomic.expire_stale_sessions(setup)
        assert expired >= 1

        product = await race.get_product(setup, product_id)
        assert product["reserved_stock"] == 0

        session_b = await checkout_atomic.initiate_checkout(setup, user_b, cart_id=cart_b)
        race.session_ids.append(session_b["session_id"])
        assert session_b["status"] == "active"

    async def test_finalize_deducts_stock_permanently(self, race):
        setup = await race.new_session()
        product_id = await race.create_product(setup, stock=5, price_cents=4500)
        user_id, cart_id = await race.create_user_with_cart(
            setup,
            [_cart_item(product_id, quantity=2, price_cents=4500)],
        )

        session = await checkout_atomic.initiate_checkout(setup, user_id, cart_id=cart_id)
        race.session_ids.append(session["session_id"])

        product = await race.get_product(setup, product_id)
        assert product["stock"] == 5
        assert product["reserved_stock"] == 2

        result = await checkout_atomic.finalize_checkout(
            setup,
            session["session_id"],
            payment_intent_id="pi_test_race_123",
            payment_method="stripe",
        )
        assert result["status"] == "completed"

        product = await race.get_product(setup, product_id)
        assert product["stock"] == 3
        assert product["reserved_stock"] == 0

        row = (
            await setup.execute(
                text("SELECT status FROM tcg_judge.checkout_sessions WHERE id = :id"),
                {"id": session["session_id"]},
            )
        ).mappings().first()
        assert row is not None
        assert row["status"] == "completed"

    async def test_cancel_releases_stock_immediately(self, race):
        setup = await race.new_session()
        product_id = await race.create_product(setup, stock=10, price_cents=50)
        user_id, cart_id = await race.create_user_with_cart(
            setup,
            [_cart_item(product_id, quantity=3, price_cents=50)],
        )

        session = await checkout_atomic.initiate_checkout(setup, user_id, cart_id=cart_id)
        race.session_ids.append(session["session_id"])

        product = await race.get_product(setup, product_id)
        assert product["reserved_stock"] == 3

        await checkout_atomic.cancel_checkout(setup, session["session_id"], user_id)

        product = await race.get_product(setup, product_id)
        assert product["reserved_stock"] == 0
        assert product["stock"] == 10

        row = (
            await setup.execute(
                text("SELECT status FROM tcg_judge.checkout_sessions WHERE id = :id"),
                {"id": session["session_id"]},
            )
        ).mappings().first()
        assert row is not None
        assert row["status"] == "cancelled"
