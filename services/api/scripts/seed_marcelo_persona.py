"""Seed da persona Marcelo TCG (admin@admin.com) — Premium / E2E.

Uso:
  cd services/api
  python scripts/seed_marcelo_persona.py

Requer DATABASE_URL apontando para o projeto alvo.
Inventário completo (~12k SKUs) e pedidos volumosos são gerados via SQL generate_series.
"""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

ROOT = Path(__file__).resolve().parents[1]

OWNER_ID = "06e79f19-f866-4527-8ba2-979db485d78a"
STORE_ID = "c0a1e8e0-5e11-4c0a-9a11-0000000a0001"
STORE_SLUG = "marcelo-tcg"
STORE_NAME = "Marcelo TCG"
PLAN = "pro"

DESCRIPTION = (
    "É uma loja especializada em Trading Card Games, atuando tanto no comércio de "
    "cartas avulsas quanto de produtos selados. Possui forte atuação em Pokémon, "
    "Magic: The Gathering, Disney Lorcana, One Piece e Star Wars Unlimited, "
    "realizando envios diários para todo o Brasil."
)

# Quantidades-alvo de SKUs por TCG (simuladas)
INVENTORY = {
    "POKEMON": 3200,
    "MTG": 5800,
    "LORCANA": 1400,
    "ONEPIECE": 900,
    "SWU": 750,
    "DIGIMON": 300,
}

# Pedidos — amostragem suficiente p/ UI + volume de concluídos via generate_series
ORDERS = {
    "delivered": 2145,
    "processing": 48,
    "shipped": 17,
    "pending": 6,
    "cancelled": 4,
}

MONTH_REVENUE_CENTS = 8_435_000
RATING = 4.9
REVIEW_COUNT = 1128


def _load_env() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def _normalize_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


async def seed(*, full_inventory: bool = True) -> None:
    _load_env()
    url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL / SUPABASE_DB_URL ausente")

    engine = create_async_engine(_normalize_url(url), pool_pre_ping=True)
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO tcg_judge.judge_profiles (id, display_name, role)
                VALUES (:id, 'Marcelo Henrique Costa', 'admin')
                ON CONFLICT (id) DO UPDATE SET
                  display_name = EXCLUDED.display_name,
                  updated_at = NOW()
                """
            ),
            {"id": OWNER_ID},
        )

        await conn.execute(
            text(
                """
                INSERT INTO tcg_judge.player_profiles (
                  id, handle, display_name, privacy_level, favorite_tcgs,
                  has_completed_onboarding, account_status, city, state, country, bio
                ) VALUES (
                  :id, 'marcelohc', 'Marcelo Henrique Costa', 'public',
                  ARRAY['POKEMON','MTG','LORCANA','ONEPIECE','SWU']::text[],
                  TRUE, 'active', 'São Paulo', 'SP', 'BR',
                  'Proprietário da Marcelo TCG'
                )
                ON CONFLICT (id) DO UPDATE SET
                  display_name = EXCLUDED.display_name,
                  handle = EXCLUDED.handle,
                  bio = EXCLUDED.bio,
                  has_completed_onboarding = TRUE,
                  account_status = 'active',
                  updated_at = NOW()
                """
            ),
            {"id": OWNER_ID},
        )

        # buyers sintéticos para pedidos
        for i in range(1, 21):
            await conn.execute(
                text(
                    """
                    INSERT INTO tcg_judge.judge_profiles (id, display_name, role)
                    VALUES (:id, :name, 'player')
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {"id": f"persona-buyer-{i:02d}", "name": f"Cliente Persona {i:02d}"},
            )
            await conn.execute(
                text(
                    """
                    INSERT INTO tcg_judge.player_profiles (
                      id, handle, display_name, privacy_level, favorite_tcgs,
                      has_completed_onboarding, account_status
                    ) VALUES (
                      :id, :handle, :name, 'public', ARRAY[]::text[], TRUE, 'active'
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {
                    "id": f"persona-buyer-{i:02d}",
                    "handle": f"persona_buyer_{i:02d}",
                    "name": f"Cliente Persona {i:02d}",
                },
            )

        await conn.execute(
            text(
                """
                INSERT INTO tcg_judge.stores (
                  id, owner_id, name, slug, description, email,
                  subscription_plan, subscription_expires_at, shop_enabled,
                  average_rating, review_count, verification_status,
                  city, state, country, phone, website
                ) VALUES (
                  CAST(:sid AS uuid), :oid, :name, :slug, :descr, 'admin@admin.com',
                  :plan, NOW() + INTERVAL '1 year', TRUE,
                  :rating, :reviews, 'verified',
                  'São Paulo', 'SP', 'BR', '+5511999990000', 'https://judgetcg.com.br'
                )
                ON CONFLICT (id) DO UPDATE SET
                  name = EXCLUDED.name,
                  slug = EXCLUDED.slug,
                  description = EXCLUDED.description,
                  email = EXCLUDED.email,
                  subscription_plan = EXCLUDED.subscription_plan,
                  subscription_expires_at = EXCLUDED.subscription_expires_at,
                  shop_enabled = TRUE,
                  average_rating = EXCLUDED.average_rating,
                  review_count = EXCLUDED.review_count,
                  verification_status = 'verified',
                  updated_at = NOW()
                """
            ),
            {
                "sid": STORE_ID,
                "oid": OWNER_ID,
                "name": STORE_NAME,
                "slug": STORE_SLUG,
                "descr": DESCRIPTION,
                "plan": PLAN,
                "rating": RATING,
                "reviews": REVIEW_COUNT,
            },
        )

        # limpa seed anterior da persona
        await conn.execute(
            text(
                """
                DELETE FROM tcg_judge.shop_order_items
                WHERE order_id IN (
                  SELECT id FROM tcg_judge.shop_orders WHERE store_id = CAST(:sid AS uuid)
                    AND COALESCE(shipping_address->>'persona', '') = 'marcelo'
                )
                """
            ),
            {"sid": STORE_ID},
        )
        await conn.execute(
            text(
                """
                DELETE FROM tcg_judge.shop_orders
                WHERE store_id = CAST(:sid AS uuid)
                  AND COALESCE(shipping_address->>'persona', '') = 'marcelo'
                """
            ),
            {"sid": STORE_ID},
        )
        await conn.execute(
            text(
                """
                DELETE FROM tcg_judge.store_products
                WHERE store_id = CAST(:sid AS uuid)
                  AND COALESCE(sku, '') LIKE 'PERSONA-%'
                """
            ),
            {"sid": STORE_ID},
        )

        if full_inventory:
            for tcg, qty in INVENTORY.items():
                await conn.execute(
                    text(
                        """
                        INSERT INTO tcg_judge.store_products (
                          store_id, name, category, price_cents, stock, tcg_id,
                          is_active, sku, description
                        )
                        SELECT
                          CAST(:sid AS uuid),
                          :tcg || ' Carta #' || g::text,
                          'single',
                          300 + ((g * 17) % 9700),
                          1 + (g % 3),
                          :tcg,
                          TRUE,
                          'PERSONA-' || :tcg || '-' || lpad(g::text, 5, '0'),
                          'Seed persona Marcelo TCG'
                        FROM generate_series(1, :qty) AS g
                        """
                    ),
                    {"sid": STORE_ID, "tcg": tcg, "qty": qty},
                )
                print(f"inventory {tcg}={qty}")
        else:
            # amostra leve (20 por jogo)
            for tcg in INVENTORY:
                await conn.execute(
                    text(
                        """
                        INSERT INTO tcg_judge.store_products (
                          store_id, name, category, price_cents, stock, tcg_id,
                          is_active, sku, description
                        )
                        SELECT
                          CAST(:sid AS uuid),
                          :tcg || ' Sample #' || g::text,
                          'single',
                          1500,
                          5,
                          :tcg,
                          TRUE,
                          'PERSONA-' || :tcg || '-S' || g::text,
                          'Seed persona sample'
                        FROM generate_series(1, 20) AS g
                        """
                    ),
                    {"sid": STORE_ID, "tcg": tcg},
                )

        # Pedidos: status operacionais exatos + delivered no volume alvo
        unit = max(1, MONTH_REVENUE_CENTS // max(1, ORDERS["delivered"]))
        for status, n in ORDERS.items():
            await conn.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shop_orders (
                      buyer_id, store_id, status, total_cents, platform_fee_cents,
                      store_receives_cents, shipping_fee_cents, payment_method,
                      shipping_address, paid_at, shipped_at, delivered_at, created_at
                    )
                    SELECT
                      'persona-buyer-' || lpad(((g % 20) + 1)::text, 2, '0'),
                      CAST(:sid AS uuid),
                      :status,
                      GREATEST(500, :unit + ((g * 37) % 8000)),
                      100,
                      GREATEST(400, :unit + ((g * 37) % 8000) - 100),
                      1500,
                      CASE WHEN g % 2 = 0 THEN 'pix' ELSE 'stripe' END,
                      jsonb_build_object('persona', 'marcelo', 'city', 'São Paulo'),
                      CASE WHEN :status IN ('paid','processing','shipped','delivered')
                           THEN NOW() - ((g % 28) || ' days')::interval ELSE NULL END,
                      CASE WHEN :status IN ('shipped','delivered')
                           THEN NOW() - ((g % 10) || ' days')::interval ELSE NULL END,
                      CASE WHEN :status = 'delivered'
                           THEN NOW() - ((g % 25) || ' days')::interval ELSE NULL END,
                      NOW() - ((g % 30) || ' days')::interval
                    FROM generate_series(1, :n) AS g
                    """
                ),
                {"sid": STORE_ID, "status": status, "n": n, "unit": unit},
            )
            print(f"orders {status}={n}")

        # membership owner se a tabela existir
        try:
            await conn.execute(
                text(
                    """
                    INSERT INTO tcg_judge.memberships (user_id, store_id, role, status, accepted_at)
                    VALUES (:oid, CAST(:sid AS uuid), 'SELLER_OWNER', 'active', NOW())
                    ON CONFLICT (user_id, store_id) DO UPDATE
                      SET role = 'SELLER_OWNER', status = 'active', accepted_at = NOW()
                    """
                ),
                {"oid": OWNER_ID, "sid": STORE_ID},
            )
        except Exception as exc:  # noqa: BLE001
            print("memberships skipped:", exc)

    await engine.dispose()
    print("done", STORE_SLUG, STORE_ID)


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--sample", action="store_true", help="Inventário leve (20 SKUs/jogo)")
    args = p.parse_args()
    asyncio.run(seed(full_inventory=not args.sample))
