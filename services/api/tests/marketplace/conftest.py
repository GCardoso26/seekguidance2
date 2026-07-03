"""Fixtures para testes de marketplace com DB real (checkout race)."""

from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pytest
import pytest_asyncio
from app.players.store import ensure_player_profile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

RACE_SCHEMA = Path(__file__).resolve().parent / "fixtures" / "checkout_race_schema.sql"


def _normalize_async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _sync_dsn(url: str) -> str:
    return (
        url.replace("postgresql+asyncpg://", "postgresql://")
        .replace("postgres+asyncpg://", "postgresql://")
    )


def _apply_race_schema(sync_dsn: str) -> None:
    import psycopg

    sql = RACE_SCHEMA.read_text(encoding="utf-8")
    with psycopg.connect(sync_dsn, autocommit=True) as conn:
        conn.execute(sql)


@pytest.fixture(scope="session")
def race_database_url() -> str:
    if os.getenv("CHECKOUT_RACE_TESTS") != "1":
        pytest.skip("Defina CHECKOUT_RACE_TESTS=1 para testes de concorrência com DB real.")

    if custom := os.getenv("CHECKOUT_RACE_DATABASE_URL"):
        yield _normalize_async_url(custom)
    elif os.getenv("RUN_CHECKOUT_RACE_DOCKER") == "1":
        from testcontainers.postgres import PostgresContainer

        with PostgresContainer("postgres:16") as pg:
            sync_dsn = pg.get_connection_url().replace("postgresql+psycopg2://", "postgresql://")
            _apply_race_schema(sync_dsn)
            yield _normalize_async_url(sync_dsn)
    else:
        base = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://tcgjudge:tcgjudge_dev@127.0.0.1:5432/tcg_judge",
        )
        yield _normalize_async_url(base)


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def race_engine(race_database_url: str):
    engine = create_async_engine(race_database_url, poolclass=NullPool)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture
def race_session_factory(race_engine):
    return async_sessionmaker(race_engine, expire_on_commit=False)


@dataclass
class RaceFixture:
    factory: async_sessionmaker[AsyncSession]
    product_ids: list[str] = field(default_factory=list)
    store_ids: list[str] = field(default_factory=list)
    user_ids: list[str] = field(default_factory=list)
    session_ids: list[str] = field(default_factory=list)

    async def new_session(self) -> AsyncSession:
        return self.factory()

    async def create_user_with_cart(
        self,
        session: AsyncSession,
        items: list[dict[str, Any]],
    ) -> tuple[str, str]:
        user_id = str(uuid.uuid4())
        await ensure_player_profile(session, user_id)
        await session.execute(
            text(
                "UPDATE tcg_judge.player_profiles SET account_status = 'active' WHERE id = :id"
            ),
            {"id": user_id},
        )
        await session.commit()

        cart_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shopping_carts (user_id, items, total_cents)
                    VALUES (:uid, CAST(:items AS jsonb), :total)
                    RETURNING id
                    """
                ),
                {
                    "uid": user_id,
                    "items": json.dumps(items),
                    "total": sum(int(i.get("price_cents", 0)) * int(i.get("quantity", 0)) for i in items),
                },
            )
        ).mappings().first()
        await session.commit()
        cart_id = str(cart_row["id"])
        self.user_ids.append(user_id)
        return user_id, cart_id

    async def create_product(
        self,
        session: AsyncSession,
        *,
        stock: int,
        reserved_stock: int = 0,
        price_cents: int = 4500,
        name: str = "Race Test Card",
        with_listing: bool = False,
    ) -> str:
        seller_id = str(uuid.uuid4())
        await ensure_player_profile(session, seller_id)
        store_id = str(uuid.uuid4())
        slug = f"race-{uuid.uuid4().hex[:10]}"
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.stores (
                  id, owner_id, name, slug, shop_enabled, pix_key
                ) VALUES (
                  :id, :owner, :name, :slug, true, 'race@test.local'
                )
                """
            ),
            {
                "id": store_id,
                "owner": seller_id,
                "name": f"Store {slug}",
                "slug": slug,
            },
        )
        product_id = str(uuid.uuid4())
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.store_products (
                  id, store_id, name, category, price_cents, stock, reserved_stock, is_active
                ) VALUES (
                  :id, :store, :name, 'accessory', :price, :stock, :reserved, true
                )
                """
            ),
            {
                "id": product_id,
                "store": store_id,
                "name": name,
                "price": price_cents,
                "stock": stock,
                "reserved": reserved_stock,
            },
        )
        if with_listing:
            card_id = str(uuid.uuid4())
            ext_id = f"race-{uuid.uuid4().hex[:12]}"
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.card_catalog (
                      id, game_code, external_id, name, normalized_name
                    ) VALUES (
                      :id, 'MTG', :ext, :name, :name
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {"id": card_id, "ext": ext_id, "name": name},
            )
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.card_listings (
                      id, card_id, seller_id, store_id, store_product_id,
                      condition, price_cents, quantity, reserved_quantity, status
                    ) VALUES (
                      :lid, :card_id, :seller, :store, :pid,
                      'NM', :price, :qty, 0, 'active'
                    )
                    """
                ),
                {
                    "lid": str(uuid.uuid4()),
                    "card_id": card_id,
                    "seller": seller_id,
                    "store": store_id,
                    "pid": product_id,
                    "price": price_cents,
                    "qty": stock,
                },
            )
        await session.commit()
        self.product_ids.append(product_id)
        self.store_ids.append(store_id)
        self.user_ids.append(seller_id)
        return product_id

    async def get_product(self, session: AsyncSession, product_id: str) -> dict[str, int]:
        row = (
            await session.execute(
                text(
                    """
                    SELECT stock, reserved_stock
                    FROM tcg_judge.store_products WHERE id = :id
                    """
                ),
                {"id": product_id},
            )
        ).mappings().first()
        assert row is not None
        return {"stock": int(row["stock"]), "reserved_stock": int(row["reserved_stock"])}

    async def count_active_sessions(self, session: AsyncSession, user_ids: list[str]) -> int:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*) AS cnt
                    FROM tcg_judge.checkout_sessions
                    WHERE status = 'active' AND user_id = ANY(CAST(:uids AS text[]))
                    """
                ),
                {"uids": user_ids},
            )
        ).mappings().first()
        return int(row["cnt"]) if row else 0

    async def cleanup(self) -> None:
        async with self.factory() as session:
            if self.session_ids:
                await session.execute(
                    text("DELETE FROM tcg_judge.checkout_sessions WHERE id = ANY(CAST(:ids AS uuid[]))"),
                    {"ids": self.session_ids},
                )
            if self.user_ids:
                await session.execute(
                    text("DELETE FROM tcg_judge.shopping_carts WHERE user_id = ANY(CAST(:uids AS text[]))"),
                    {"uids": self.user_ids},
                )
                await session.execute(
                    text("DELETE FROM tcg_judge.checkout_sessions WHERE user_id = ANY(CAST(:uids AS text[]))"),
                    {"uids": self.user_ids},
                )
            if self.product_ids:
                await session.execute(
                    text(
                        """
                        DELETE FROM tcg_judge.card_listings
                        WHERE store_product_id = ANY(CAST(:ids AS uuid[]))
                        """
                    ),
                    {"ids": self.product_ids},
                )
                await session.execute(
                    text("DELETE FROM tcg_judge.store_products WHERE id = ANY(CAST(:ids AS uuid[]))"),
                    {"ids": self.product_ids},
                )
            if self.store_ids:
                await session.execute(
                    text("DELETE FROM tcg_judge.stores WHERE id = ANY(CAST(:ids AS uuid[]))"),
                    {"ids": self.store_ids},
                )
            if self.user_ids:
                await session.execute(
                    text("DELETE FROM tcg_judge.notification_preferences WHERE player_id = ANY(CAST(:uids AS text[]))"),
                    {"uids": self.user_ids},
                )
                await session.execute(
                    text("DELETE FROM tcg_judge.player_profiles WHERE id = ANY(CAST(:uids AS text[]))"),
                    {"uids": self.user_ids},
                )
                await session.execute(
                    text("DELETE FROM tcg_judge.judge_profiles WHERE id = ANY(CAST(:uids AS text[]))"),
                    {"uids": self.user_ids},
                )
            await session.commit()


@pytest_asyncio.fixture(loop_scope="session")
async def race(race_session_factory):
    fx = RaceFixture(factory=race_session_factory)
    yield fx
    await fx.cleanup()
