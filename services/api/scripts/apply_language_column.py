import asyncio
import os
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

for line in Path(".env").read_text(encoding="utf-8").splitlines():
    if line.startswith("DATABASE_URL="):
        url = line.split("=", 1)[1].strip().strip('"').strip("'")


async def main() -> None:
    u = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(u)
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                ALTER TABLE tcg_judge.store_products
                  ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'pt'
                """
            )
        )
        col = await conn.execute(
            text(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema='tcg_judge' AND table_name='store_products'
                  AND column_name='language'
                """
            )
        )
        print("language_col", col.scalar())
        ink = await conn.execute(
            text(
                """
                SELECT COUNT(*) FROM tcg_judge.card_catalog
                WHERE game_code='LORCANA' AND COALESCE(game_data->>'ink','') <> ''
                """
            )
        )
        print("with_ink", ink.scalar())
        dup = await conn.execute(
            text(
                """
                SELECT COUNT(*) FROM tcg_judge.store_products p
                WHERE p.store_id = '19c48c72-559e-43f5-817d-c1287aea0251'
                  AND p.is_active
                  AND EXISTS (
                    SELECT 1 FROM tcg_judge.store_products p2
                    WHERE p2.store_id = p.store_id AND p2.is_active AND p2.id <> p.id
                      AND (
                        (p.catalog_card_id IS NOT NULL AND p2.catalog_card_id = p.catalog_card_id
                         AND COALESCE(p.language,'pt') = COALESCE(p2.language,'pt'))
                        OR (lower(trim(p.name)) = lower(trim(p2.name))
                            AND COALESCE(p.sku,'') = COALESCE(p2.sku,''))
                      )
                  )
                """
            )
        )
        print("duplicates", dup.scalar())
    await engine.dispose()


asyncio.run(main())
