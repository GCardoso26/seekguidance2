"""Amplia colunas varchar de card_catalog para cartas MTG longas."""

from __future__ import annotations

import asyncio

from app.infrastructure.db.session import get_session_factory
from sqlalchemy import text

ALTERS = [
    "ALTER TABLE tcg_judge.card_catalog ALTER COLUMN card_type TYPE VARCHAR(200)",
    "ALTER TABLE tcg_judge.card_catalog ALTER COLUMN game_specific_type TYPE VARCHAR(200)",
    "ALTER TABLE tcg_judge.card_catalog ALTER COLUMN name TYPE VARCHAR(300)",
    "ALTER TABLE tcg_judge.card_catalog ALTER COLUMN normalized_name TYPE VARCHAR(300)",
    "ALTER TABLE tcg_judge.card_catalog ALTER COLUMN set_name TYPE VARCHAR(200)",
]


async def main() -> None:
    async with get_session_factory()() as session:
        for stmt in ALTERS:
            await session.execute(text(stmt))
        await session.commit()
        print("Colunas ampliadas.")


if __name__ == "__main__":
    asyncio.run(main())
