import asyncio
import os
import re
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

for line in Path(".env").read_text(encoding="utf-8").splitlines():
    if line.startswith("DATABASE_URL="):
        url = line.split("=", 1)[1].strip().strip('"').strip("'")

m = re.match(r"postgres(?:ql)?://([^:]+):([^@]+)@([^/]+)/([^?]+)", url)
print("user_prefix", (m.group(1)[:24] if m else None))
print("host", m.group(3) if m else None)
print("db", m.group(4) if m else None)


async def main() -> None:
    u = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(u)
    async with engine.connect() as conn:
        row = (
            await conn.execute(
                text(
                    """
                    SELECT current_database(),
                           (SELECT name FROM tcg_judge.card_catalog
                            WHERE game_code='LORCANA' AND set_code='ARI'
                              AND regexp_replace(COALESCE(card_number::text,''), '^0+', '') = '1'
                            LIMIT 1),
                           (SELECT game_data->>'ink' FROM tcg_judge.card_catalog
                            WHERE game_code='LORCANA' AND set_code='ARI'
                              AND regexp_replace(COALESCE(card_number::text,''), '^0+', '') = '1'
                            LIMIT 1),
                           (SELECT COUNT(*) FROM tcg_judge.card_catalog
                            WHERE game_code='LORCANA' AND COALESCE(game_data->>'ink','') <> '')
                    """
                )
            )
        ).one()
        print("db", row[0], "name", row[1], "ink", row[2], "with_ink", row[3])
    await engine.dispose()


asyncio.run(main())
