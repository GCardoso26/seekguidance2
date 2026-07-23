"""Aplica backfill de ink Lorcana via DATABASE_URL."""

from __future__ import annotations

import asyncio
import os
import re
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


def _load_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


def _normalize_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


async def main() -> None:
    _load_env()
    url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    if not url:
        raise SystemExit("DATABASE_URL ausente")
    sql_path = Path(__file__).resolve().parents[1] / "tmp_lorcana_ink_updates.sql"
    raw = sql_path.read_text(encoding="utf-8")
    statements = [s.strip() for s in re.split(r";\s*\n", raw) if s.strip()]
    engine = create_async_engine(_normalize_url(url), pool_pre_ping=True)
    updated = 0
    async with engine.begin() as conn:
        for i, stmt in enumerate(statements, 1):
            if not stmt.upper().startswith("UPDATE"):
                continue
            result = await conn.execute(text(stmt))
            updated += result.rowcount or 0
            print(f"batch {i}/{len(statements)} rowcount={result.rowcount}")
    await engine.dispose()
    print(f"done total_rowcount={updated}")


if __name__ == "__main__":
    asyncio.run(main())
