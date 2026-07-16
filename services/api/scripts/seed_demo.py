"""CLI: seed Admin Sandbox demo data.

Usage (from services/api):
  python scripts/seed_demo.py
  python scripts/seed_demo.py --user-id <uuid>

Blocked when APP_MODE=production. Beta requires SEED_DEMO_FORCE=1.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))


async def _main(user_id: str | None) -> int:
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.sandbox.mode import can_run_seed_demo, get_app_mode
    from app.sandbox.seeder import SeedBlockedError, seed_demo

    print(f"APP_MODE={get_app_mode()}")
    if not can_run_seed_demo():
        print("ERROR: seed_demo blocked for this APP_MODE", file=sys.stderr)
        return 2

    url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://tcgjudge:tcgjudge_dev@127.0.0.1:5432/tcg_judge",
    )
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(url)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        try:
            report = await seed_demo(session, owner_user_id=user_id)
        except SeedBlockedError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            await engine.dispose()
            return 2
        print(json.dumps(report, indent=2, default=str))
    await engine.dispose()
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed JudgeTCG Admin Sandbox demo data")
    parser.add_argument("--user-id", default=None, help="Owner user id (default demo-sandbox-admin)")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(_main(args.user_id)))


if __name__ == "__main__":
    main()
