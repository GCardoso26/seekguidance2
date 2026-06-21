"""Verifica colunas de card_catalog e aplica migration Phase 0 se faltar."""

from __future__ import annotations

import asyncio
from pathlib import Path

from sqlalchemy import text

from app.infrastructure.db.session import get_session_factory

MIGRATION = Path(__file__).resolve().parents[3] / "supabase/migrations/20260621140000_card_catalog_phase0.sql"


async def main() -> None:
    async with get_session_factory()() as session:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'tcg_judge' AND table_name = 'card_catalog'
                    ORDER BY ordinal_position
                    """
                )
            )
        ).fetchall()
        cols = [r[0] for r in rows]
        print("Colunas atuais:", cols)

        if "external_ids" not in cols:
            print("Aplicando migration Phase 0...")
            sql = MIGRATION.read_text(encoding="utf-8")
            for stmt in sql.split(";"):
                stmt = stmt.strip()
                if stmt and not stmt.startswith("--"):
                    await session.execute(text(stmt))
            await session.commit()
            print("Migration aplicada.")
        else:
            print("Migration Phase 0 já presente.")


if __name__ == "__main__":
    asyncio.run(main())
