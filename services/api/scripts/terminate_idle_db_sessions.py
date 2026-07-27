"""
Terminate idle client sessions on Supabase when near EMAXCONNSESSION.

Safe filters:
- state = idle (not active / idle in transaction)
- idle >= IDLE_SECONDS (default 60)
- skip Supabase system roles and PostgREST LISTEN

Usage (from services/api with DATABASE_URL):
  npx --yes tsx is wrong — this is Python:
  python -m scripts.terminate_idle_db_sessions
  DRY_RUN=1 python -m scripts.terminate_idle_db_sessions
"""

from __future__ import annotations

import asyncio
import os
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


def _normalize_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


async def main() -> int:
    url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    if not url:
        print("DATABASE_URL required", file=sys.stderr)
        return 1

    idle_seconds = int(os.getenv("IDLE_SECONDS", "60"))
    dry_run = os.getenv("DRY_RUN", "").strip() in ("1", "true", "yes")

    engine = create_async_engine(
        _normalize_url(url),
        pool_size=1,
        max_overflow=0,
        connect_args={"ssl": "require"} if "supabase" in url or "pooler" in url else {},
    )

    list_sql = text(
        """
        SELECT pid, usename, application_name, state,
               extract(epoch from (now() - state_change))::int AS idle_for_s,
               left(query, 80) AS query_preview
        FROM pg_stat_activity
        WHERE datname IS NOT NULL
          AND pid <> pg_backend_pid()
          AND state = 'idle'
          AND state_change < now() - make_interval(secs => :idle_seconds)
          AND usename NOT IN (
            'supabase_admin', 'supabase_auth_admin', 'supabase_storage_admin',
            'supabase_realtime_admin', 'pgbouncer', 'authenticator'
          )
          AND coalesce(application_name, '') NOT ILIKE '%supabase%'
          AND coalesce(application_name, '') NOT ILIKE '%postgrest%'
          AND query NOT ILIKE 'LISTEN%'
        ORDER BY state_change
        """
    )

    kill_sql = text(
        """
        SELECT pid, pg_terminate_backend(pid) AS terminated
        FROM pg_stat_activity
        WHERE datname IS NOT NULL
          AND pid <> pg_backend_pid()
          AND state = 'idle'
          AND state_change < now() - make_interval(secs => :idle_seconds)
          AND usename NOT IN (
            'supabase_admin', 'supabase_auth_admin', 'supabase_storage_admin',
            'supabase_realtime_admin', 'pgbouncer', 'authenticator'
          )
          AND coalesce(application_name, '') NOT ILIKE '%supabase%'
          AND coalesce(application_name, '') NOT ILIKE '%postgrest%'
          AND query NOT ILIKE 'LISTEN%'
        """
    )

    async with engine.connect() as conn:
        rows = (await conn.execute(list_sql, {"idle_seconds": idle_seconds})).mappings().all()
        print(f"idle_candidates={len(rows)} idle_seconds>={idle_seconds} dry_run={dry_run}")
        for row in rows:
            print(dict(row))
        if dry_run or not rows:
            await engine.dispose()
            return 0
        killed = (await conn.execute(kill_sql, {"idle_seconds": idle_seconds})).mappings().all()
        await conn.commit()
        print(f"terminated={sum(1 for r in killed if r['terminated'])}")

    await engine.dispose()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
