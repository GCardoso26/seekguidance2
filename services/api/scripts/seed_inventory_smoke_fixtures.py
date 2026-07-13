"""
CLI: registra produtos e compras só para testes de estoque multi-fonte.

  cd services/api
  python -m scripts.seed_inventory_smoke_fixtures
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

# Garante import de tests.marketplace quando rodado como script
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from tests.marketplace.inventory_smoke_fixtures import (  # noqa: E402
    fixture_to_dict,
    seed_inventory_smoke,
)


async def _main() -> None:
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://tcgjudge:tcgjudge_dev@127.0.0.1:5432/tcg_judge",
    )
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(url)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        fx = await seed_inventory_smoke(session)
        print("Seed OK:", fixture_to_dict(fx))
        print("Rode o smoke com: INVENTORY_SMOKE_TESTS=1 pytest tests/marketplace/test_seller_inventory_smoke.py -q")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(_main())
