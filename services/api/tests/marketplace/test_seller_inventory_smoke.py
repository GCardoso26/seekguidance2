"""
Smoke DB: estoque multi-fonte com produtos e compras só de teste.

Requer:
  INVENTORY_SMOKE_TESTS=1
  DATABASE_URL apontando para Postgres com schema tcg_judge

Roda:
  INVENTORY_SMOKE_TESTS=1 pytest tests/marketplace/test_seller_inventory_smoke.py -q
"""

from __future__ import annotations

import os

import pytest
import pytest_asyncio
from app.marketplace.seller_inventory_search import adjust_inventory, search_inventory
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from tests.marketplace.inventory_smoke_fixtures import (
    cleanup_inventory_smoke,
    seed_inventory_smoke,
)

pytestmark = pytest.mark.asyncio


def _normalize_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


@pytest.fixture(scope="module")
def smoke_database_url() -> str:
    if os.getenv("INVENTORY_SMOKE_TESTS") != "1":
        pytest.skip("Defina INVENTORY_SMOKE_TESTS=1 para smoke de estoque com DB real.")
    return _normalize_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://tcgjudge:tcgjudge_dev@127.0.0.1:5432/tcg_judge",
        )
    )


@pytest_asyncio.fixture(scope="module")
async def smoke_engine(smoke_database_url: str):
    engine = create_async_engine(smoke_database_url, poolclass=NullPool)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest_asyncio.fixture
async def smoke_session(smoke_engine):
    factory = async_sessionmaker(smoke_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def smoke_fx(smoke_session: AsyncSession):
    fx = await seed_inventory_smoke(smoke_session, game_code="POKEMON")
    try:
        yield fx
    finally:
        await cleanup_inventory_smoke(smoke_session, fx)


async def test_my_catalog_products_and_cards(smoke_session: AsyncSession, smoke_fx):
    products = await search_inventory(
        smoke_session,
        smoke_fx.owner_id,
        source="my_catalog",
        kind="products",
        q=smoke_fx.product_name,
    )
    assert products["total"] >= 1
    assert any(i["title"] == smoke_fx.product_name for i in products["items"])

    cards = await search_inventory(
        smoke_session,
        smoke_fx.owner_id,
        source="my_catalog",
        kind="cards",
        game="pokemon",
        q=smoke_fx.card_name,
    )
    assert cards["total"] >= 1
    hit = next(i for i in cards["items"] if i["card_id"] == smoke_fx.card_id)
    assert hit["listing_id"] == smoke_fx.listing_id
    assert hit["quantity"] == 5


async def test_system_base_finds_catalog_card(smoke_session: AsyncSession, smoke_fx):
    result = await search_inventory(
        smoke_session,
        smoke_fx.owner_id,
        source="system",
        kind="cards",
        game="pokemon",
        q=smoke_fx.card_name,
    )
    assert any(i.get("card_id") == smoke_fx.card_id for i in result["items"])


async def test_bestsellers_store_and_marketplace(smoke_session: AsyncSession, smoke_fx):
    store = await search_inventory(
        smoke_session,
        smoke_fx.owner_id,
        source="bestsellers_store",
        kind="products",
        period="month",
        q="INV-SMOKE",
    )
    assert any(i["title"] == smoke_fx.product_name for i in store["items"])
    sold = next(i for i in store["items"] if i["title"] == smoke_fx.product_name)
    assert int(sold.get("sold_qty") or 0) >= 2

    mkt = await search_inventory(
        smoke_session,
        smoke_fx.owner_id,
        source="bestsellers_marketplace",
        kind="products",
        period="month",
        q="INV-SMOKE Marketplace",
    )
    assert any("Marketplace Booster" in i["title"] for i in mkt["items"])


async def test_adjust_set_and_add_product(smoke_session: AsyncSession, smoke_fx):
    set_res = await adjust_inventory(
        smoke_session,
        smoke_fx.owner_id,
        kind="products",
        mode="set",
        quantity=20,
        product_id=smoke_fx.product_id,
        price_cents=3990,
    )
    assert set_res["created"] is False
    assert int(set_res["item"]["stock"]) == 20

    add_res = await adjust_inventory(
        smoke_session,
        smoke_fx.owner_id,
        kind="products",
        mode="add",
        quantity=3,
        product_id=smoke_fx.product_id,
    )
    assert int(add_res["item"]["stock"]) == 23


async def test_adjust_set_and_add_listing(smoke_session: AsyncSession, smoke_fx):
    set_res = await adjust_inventory(
        smoke_session,
        smoke_fx.owner_id,
        kind="cards",
        mode="set",
        quantity=8,
        listing_id=smoke_fx.listing_id,
        price_cents=1800,
    )
    assert set_res["created"] is False
    assert int(set_res["item"]["quantity"]) == 8

    add_res = await adjust_inventory(
        smoke_session,
        smoke_fx.owner_id,
        kind="cards",
        mode="add",
        quantity=2,
        listing_id=smoke_fx.listing_id,
    )
    assert int(add_res["item"]["quantity"]) == 10
