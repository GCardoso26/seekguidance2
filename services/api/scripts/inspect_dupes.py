import asyncio
import os
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

for line in Path(".env").read_text(encoding="utf-8").splitlines():
    if line.startswith("DATABASE_URL="):
        url = line.split("=", 1)[1].strip().strip('"').strip("'")

STORE = "19c48c72-559e-43f5-817d-c1287aea0251"


async def main() -> None:
    engine = create_async_engine(url.replace("postgresql://", "postgresql+asyncpg://", 1))
    async with engine.connect() as conn:
        # Groups by catalog+language+foil hint in name, or name+sku
        rows = (
            await conn.execute(
                text(
                    """
                    SELECT
                      COALESCE(catalog_card_id::text, '') AS cid,
                      COALESCE(language, 'pt') AS lang,
                      (name LIKE '%★%') AS is_foil,
                      lower(trim(name)) AS nkey,
                      COALESCE(sku, '') AS sku,
                      COUNT(*) AS c,
                      array_agg(id::text ORDER BY created_at ASC, id ASC) AS ids,
                      array_agg(stock ORDER BY created_at ASC, id ASC) AS stocks,
                      MIN(name) AS sample_name
                    FROM tcg_judge.store_products
                    WHERE store_id = :sid AND is_active AND category = 'single'
                    GROUP BY 1, 2, 3, 4, 5
                    HAVING COUNT(*) > 1
                    ORDER BY c DESC
                    LIMIT 30
                    """
                ),
                {"sid": STORE},
            )
        ).mappings().all()
        print("dup_groups", len(rows))
        for r in rows[:10]:
            print(dict(r))

        totals = (
            await conn.execute(
                text(
                    """
                    SELECT
                      COUNT(*) AS products,
                      COUNT(*) FILTER (WHERE name LIKE '%★%') AS foil_named,
                      COUNT(*) FILTER (WHERE catalog_card_id IS NOT NULL) AS matched
                    FROM tcg_judge.store_products
                    WHERE store_id = :sid AND is_active AND category = 'single'
                    """
                ),
                {"sid": STORE},
            )
        ).mappings().first()
        print("totals", dict(totals or {}))
    await engine.dispose()


asyncio.run(main())
