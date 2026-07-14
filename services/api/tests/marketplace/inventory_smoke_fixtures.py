"""
Fixtures de estoque multi-fonte — apenas para testes.

Cria loja, produtos físicos, cartas no catálogo, listagens e pedidos pagos
para exercitar Meu Cadastro / Base interna / Mais Vendidas.

Uso:
  python -m scripts.seed_inventory_smoke_fixtures
  INVENTORY_SMOKE_TESTS=1 pytest tests/marketplace/test_seller_inventory_smoke.py -q
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

from app.players.store import ensure_player_profile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

PREFIX = "INV-SMOKE"


@dataclass
class InventorySmokeFixture:
    owner_id: str
    store_id: str
    buyer_id: str
    product_id: str
    product_name: str
    card_id: str
    card_name: str
    listing_id: str
    listing_product_id: str
    order_id: str
    other_store_id: str | None = None
    other_product_id: str | None = None
    ids: dict[str, list[str]] = field(default_factory=dict)


async def seed_inventory_smoke(
    session: AsyncSession,
    *,
    game_code: str = "POKEMON",
) -> InventorySmokeFixture:
    """Registra produtos/compras de teste e devolve IDs para cleanup."""
    suffix = uuid.uuid4().hex[:10]
    owner_id = f"{PREFIX}-owner-{suffix}"
    buyer_id = f"{PREFIX}-buyer-{suffix}"
    store_id = str(uuid.uuid4())
    other_store_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())
    other_product_id = str(uuid.uuid4())
    card_id = str(uuid.uuid4())
    listing_id = str(uuid.uuid4())
    listing_product_id = str(uuid.uuid4())
    order_id = str(uuid.uuid4())
    other_order_id = str(uuid.uuid4())

    product_name = f"{PREFIX} Sleeve Premium {suffix}"
    card_name = f"{PREFIX} Pikachu {suffix}"
    other_product_name = f"{PREFIX} Marketplace Booster {suffix}"

    for uid in (owner_id, buyer_id):
        await ensure_player_profile(session, uid)
    await session.commit()

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.stores (
              id, owner_id, name, slug, shop_enabled, pix_key
            ) VALUES (
              :id, :owner, :name, :slug, true, :pix
            )
            """
        ),
        {
            "id": store_id,
            "owner": owner_id,
            "name": f"{PREFIX} Store {suffix}",
            "slug": f"inv-smoke-{suffix}",
            "pix": f"smoke-{suffix}@test.local",
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.stores (
              id, owner_id, name, slug, shop_enabled, pix_key
            ) VALUES (
              :id, :owner, :name, :slug, true, :pix
            )
            """
        ),
        {
            "id": other_store_id,
            "owner": owner_id,
            "name": f"{PREFIX} Other {suffix}",
            "slug": f"inv-smoke-other-{suffix}",
            "pix": f"smoke-other-{suffix}@test.local",
        },
    )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.store_products (
              id, store_id, name, category, price_cents, stock, sku, is_active, catalog_card_id
            ) VALUES (
              :id, :sid, :name, 'sleeve', 3490, 12, :sku, true, NULL
            )
            """
        ),
        {"id": product_id, "sid": store_id, "name": product_name, "sku": f"SMOKE-SLV-{suffix}"},
    )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.store_products (
              id, store_id, name, category, price_cents, stock, sku, is_active, catalog_card_id
            ) VALUES (
              :id, :sid, :name, 'booster', 1990, 40, :sku, true, NULL
            )
            """
        ),
        {
            "id": other_product_id,
            "sid": other_store_id,
            "name": other_product_name,
            "sku": f"SMOKE-BST-{suffix}",
        },
    )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.card_catalog (
              id, game_code, external_id, name, normalized_name, set_code, set_name, language
            ) VALUES (
              :id, :g, :ext, :name, :norm, 'SVI', 'Scarlet & Violet', 'pt'
            )
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {
            "id": card_id,
            "g": game_code,
            "ext": f"smoke-{suffix}",
            "name": card_name,
            "norm": card_name.lower(),
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.store_products (
              id, store_id, name, category, price_cents, stock, is_active, catalog_card_id
            ) VALUES (
              :id, :sid, :name, 'single', 1500, 5, true, :cid
            )
            """
        ),
        {
            "id": listing_product_id,
            "sid": store_id,
            "name": f"{card_name} (NM)",
            "cid": card_id,
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.card_listings (
              id, card_id, seller_id, store_id, store_product_id,
              condition, price_cents, quantity, foil, language, status
            ) VALUES (
              :lid, :cid, :seller, :sid, :pid,
              'NM', 1500, 5, false, 'pt', 'active'
            )
            """
        ),
        {
            "lid": listing_id,
            "cid": card_id,
            "seller": owner_id,
            "sid": store_id,
            "pid": listing_product_id,
        },
    )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_orders (
              id, buyer_id, store_id, status, total_cents,
              platform_fee_cents, store_receives_cents
            ) VALUES (
              :oid, :buyer, :sid, 'paid', 8480, 0, 8480
            )
            """
        ),
        {"oid": order_id, "buyer": buyer_id, "sid": store_id},
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_order_items (
              order_id, product_id, product_name, quantity,
              unit_price_cents, total_price_cents
            ) VALUES
              (:oid, :pid, :pname, 2, 3490, 6980),
              (:oid, :lpid, :cname, 1, 1500, 1500)
            """
        ),
        {
            "oid": order_id,
            "pid": product_id,
            "pname": product_name,
            "lpid": listing_product_id,
            "cname": f"{card_name} (NM)",
        },
    )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_orders (
              id, buyer_id, store_id, status, total_cents,
              platform_fee_cents, store_receives_cents
            ) VALUES (
              :oid, :buyer, :sid, 'paid', 5970, 0, 5970
            )
            """
        ),
        {"oid": other_order_id, "buyer": buyer_id, "sid": other_store_id},
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_order_items (
              order_id, product_id, product_name, quantity,
              unit_price_cents, total_price_cents
            ) VALUES (
              :oid, :pid, :pname, 3, 1990, 5970
            )
            """
        ),
        {"oid": other_order_id, "pid": other_product_id, "pname": other_product_name},
    )

    await session.commit()

    return InventorySmokeFixture(
        owner_id=owner_id,
        store_id=store_id,
        buyer_id=buyer_id,
        product_id=product_id,
        product_name=product_name,
        card_id=card_id,
        card_name=card_name,
        listing_id=listing_id,
        listing_product_id=listing_product_id,
        order_id=order_id,
        other_store_id=other_store_id,
        other_product_id=other_product_id,
        ids={
            "order_ids": [order_id, other_order_id],
            "listing_ids": [listing_id],
            "product_ids": [product_id, listing_product_id, other_product_id],
            "store_ids": [store_id, other_store_id],
            "card_ids": [card_id],
            "user_ids": [owner_id, buyer_id],
        },
    )


async def cleanup_inventory_smoke(session: AsyncSession, fx: InventorySmokeFixture) -> None:
    """Remove dados criados pelo seed (best-effort)."""
    order_ids = fx.ids.get("order_ids") or [fx.order_id]
    await session.execute(
        text("DELETE FROM tcg_judge.shop_order_items WHERE order_id = ANY(CAST(:ids AS uuid[]))"),
        {"ids": order_ids},
    )
    await session.execute(
        text("DELETE FROM tcg_judge.shop_orders WHERE id = ANY(CAST(:ids AS uuid[]))"),
        {"ids": order_ids},
    )
    await session.execute(
        text("DELETE FROM tcg_judge.card_listings WHERE id = ANY(CAST(:ids AS uuid[]))"),
        {"ids": fx.ids.get("listing_ids") or [fx.listing_id]},
    )
    await session.execute(
        text("DELETE FROM tcg_judge.store_products WHERE id = ANY(CAST(:ids AS uuid[]))"),
        {"ids": fx.ids.get("product_ids") or []},
    )
    await session.execute(
        text("DELETE FROM tcg_judge.stores WHERE id = ANY(CAST(:ids AS uuid[]))"),
        {"ids": fx.ids.get("store_ids") or [fx.store_id]},
    )
    await session.execute(
        text("DELETE FROM tcg_judge.card_catalog WHERE id = ANY(CAST(:ids AS uuid[]))"),
        {"ids": fx.ids.get("card_ids") or [fx.card_id]},
    )
    await session.execute(
        text("DELETE FROM tcg_judge.player_profiles WHERE id = ANY(CAST(:ids AS text[]))"),
        {"ids": fx.ids.get("user_ids") or [fx.owner_id, fx.buyer_id]},
    )
    await session.commit()


def fixture_to_dict(fx: InventorySmokeFixture) -> dict[str, Any]:
    return {
        "owner_id": fx.owner_id,
        "store_id": fx.store_id,
        "product_id": fx.product_id,
        "product_name": fx.product_name,
        "card_id": fx.card_id,
        "card_name": fx.card_name,
        "listing_id": fx.listing_id,
        "order_id": fx.order_id,
    }
