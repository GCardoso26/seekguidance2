import asyncio
import os
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

for line in Path(".env").read_text(encoding="utf-8").splitlines():
    if line.startswith("DATABASE_URL="):
        url = line.split("=", 1)[1].strip().strip('"').strip("'")


async def main() -> None:
    engine = create_async_engine(url.replace("postgresql://", "postgresql+asyncpg://", 1))
    async with engine.connect() as conn:
        stores = (
            await conn.execute(
                text(
                    """
                    SELECT s.id::text, s.slug, s.name,
                           COUNT(p.*) FILTER (WHERE p.is_active) AS active,
                           COUNT(p.*) AS all_p
                    FROM tcg_judge.stores s
                    LEFT JOIN tcg_judge.store_products p ON p.store_id = s.id
                    GROUP BY s.id
                    HAVING COUNT(p.*) > 0
                    ORDER BY active DESC
                    LIMIT 10
                    """
                )
            )
        ).mappings().all()
        print("stores_with_products")
        for r in stores:
            print(dict(r))

        # Dupes across all stores: catalog+lang+foil OR name+sku
        dups = (
            await conn.execute(
                text(
                    """
                    WITH keyed AS (
                      SELECT
                        id, store_id, name, sku, stock, created_at, is_active,
                        catalog_card_id,
                        COALESCE(language, 'pt') AS lang,
                        (position('★' in name) > 0) AS is_foil,
                        CASE
                          WHEN catalog_card_id IS NOT NULL THEN
                            'cid:' || catalog_card_id::text || '|f:' || (position('★' in name) > 0)::text || '|l:' || COALESCE(language, 'pt')
                          ELSE
                            'n:' || lower(trim(name)) || '|s:' || COALESCE(sku, '')
                        END AS dup_key
                      FROM tcg_judge.store_products
                      WHERE category = 'single' AND is_active
                    )
                    SELECT store_id::text, dup_key, COUNT(*) AS c,
                           SUM(stock) AS stock_sum,
                           array_agg(id::text ORDER BY created_at, id) AS ids,
                           MIN(name) AS sample
                    FROM keyed
                    GROUP BY store_id, dup_key
                    HAVING COUNT(*) > 1
                    ORDER BY c DESC
                    LIMIT 40
                    """
                )
            )
        ).mappings().all()
        print("dup_groups", len(dups))
        for r in dups[:15]:
            print(dict(r))
        total_extra = sum(int(r["c"]) - 1 for r in dups)
        print("extra_rows_to_remove_sample", total_extra)
    await engine.dispose()


asyncio.run(main())
