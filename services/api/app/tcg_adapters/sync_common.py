"""Helpers partilhados para sync de cartas."""

from __future__ import annotations

import re
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip().lower())


async def upsert_card(session: AsyncSession, card: dict[str, Any]) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.card_catalog (
              game_code, external_id, set_code, set_name, card_number, name,
              normalized_name, rarity, card_type, game_specific_type,
              legality, image_url, game_data, last_synced_at
            ) VALUES (
              :game_code, :external_id, :set_code, :set_name, :card_number, :name,
              :normalized_name, :rarity, :card_type, :game_specific_type,
              :legality::jsonb, :image_url, :game_data::jsonb, NOW()
            )
            ON CONFLICT (game_code, external_id) DO UPDATE SET
              name = EXCLUDED.name,
              normalized_name = EXCLUDED.normalized_name,
              set_code = EXCLUDED.set_code,
              rarity = EXCLUDED.rarity,
              legality = EXCLUDED.legality,
              image_url = EXCLUDED.image_url,
              game_data = EXCLUDED.game_data,
              last_synced_at = NOW()
            """
        ),
        {
            "game_code": card["game_code"],
            "external_id": card["external_id"],
            "set_code": card.get("set_code"),
            "set_name": card.get("set_name"),
            "card_number": card.get("card_number"),
            "name": card["name"],
            "normalized_name": card.get("normalized_name") or normalize_name(card["name"]),
            "rarity": card.get("rarity"),
            "card_type": card.get("card_type"),
            "game_specific_type": card.get("game_specific_type"),
            "legality": __import__("json").dumps(card.get("legality") or {}),
            "image_url": card.get("image_url"),
            "game_data": __import__("json").dumps(card.get("game_data") or {}),
        },
    )
