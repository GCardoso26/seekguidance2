"""Aplica migration Phase 0 em tcg_judge.card_catalog se faltar colunas."""

from __future__ import annotations

import asyncio

from sqlalchemy import text

from app.infrastructure.db.session import get_session_factory

STATEMENTS = [
    "SET search_path TO tcg_judge, public",
    """
    ALTER TABLE tcg_judge.card_catalog
      ADD COLUMN IF NOT EXISTS external_ids JSONB NOT NULL DEFAULT '{}'::jsonb
    """,
    """
    ALTER TABLE tcg_judge.card_catalog
      ADD COLUMN IF NOT EXISTS image_uris JSONB NOT NULL DEFAULT '{}'::jsonb
    """,
    """
    ALTER TABLE tcg_judge.card_catalog
      ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en'
    """,
    """
    ALTER TABLE tcg_judge.card_catalog
      ADD COLUMN IF NOT EXISTS source VARCHAR(40)
    """,
    """
    ALTER TABLE tcg_judge.card_catalog
      ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1
    """,
    """
    ALTER TABLE tcg_judge.card_catalog
      ADD COLUMN IF NOT EXISTS is_reprint BOOLEAN NOT NULL DEFAULT FALSE
    """,
    """
    ALTER TABLE tcg_judge.card_catalog
      ADD COLUMN IF NOT EXISTS original_card_id UUID REFERENCES tcg_judge.card_catalog(id)
    """,
    """
    ALTER TABLE tcg_judge.card_catalog
      ADD COLUMN IF NOT EXISTS set_release_date DATE
    """,
    """
    UPDATE tcg_judge.card_catalog
    SET external_ids = jsonb_build_object(
      CASE game_code
        WHEN 'MTG' THEN 'scryfall'
        WHEN 'POKEMON' THEN 'pokemonTcgApi'
        WHEN 'LORCANA' THEN 'lorcanaApi'
        WHEN 'YGO' THEN 'ygoprodeck'
        ELSE 'external'
      END,
      external_id
    ),
    image_uris = CASE
      WHEN image_url IS NOT NULL AND image_url <> '' THEN jsonb_build_object('normal', image_url)
      ELSE '{}'::jsonb
    END,
    source = COALESCE(source, lower(game_code))
    WHERE external_ids = '{}'::jsonb OR external_ids IS NULL
    """,
    """
    CREATE TABLE IF NOT EXISTS tcg_judge.card_prices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      card_id UUID NOT NULL REFERENCES tcg_judge.card_catalog(id) ON DELETE CASCADE,
      source VARCHAR(40) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      price_cents INT NOT NULL,
      condition VARCHAR(10),
      foil BOOLEAN NOT NULL DEFAULT FALSE,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_card_prices_card ON tcg_judge.card_prices(card_id)",
    "CREATE INDEX IF NOT EXISTS idx_card_prices_recorded ON tcg_judge.card_prices(recorded_at DESC)",
    """
    CREATE TABLE IF NOT EXISTS tcg_judge.card_sync_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_code VARCHAR(10) NOT NULL,
      source VARCHAR(40) NOT NULL,
      status VARCHAR(20) NOT NULL,
      cards_synced INT NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_card_sync_runs_game ON tcg_judge.card_sync_runs(game_code, started_at DESC)",
    """
    CREATE INDEX IF NOT EXISTS idx_card_catalog_search
      ON tcg_judge.card_catalog USING gin(to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(set_name, '')))
    """,
]


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
        print("Colunas:", cols)

        if "external_ids" in cols:
            print("Phase 0 já aplicada.")
            return

        for stmt in STATEMENTS:
            await session.execute(text(stmt))
        await session.commit()
        print("Phase 0 aplicada com sucesso.")


if __name__ == "__main__":
    asyncio.run(main())
