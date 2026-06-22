"""Helpers partilhados para sync de cartas."""

from __future__ import annotations

import json
import re
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip().lower())


def _trunc(value: str | None, max_len: int) -> str | None:
    if value is None:
        return None
    text = str(value)
    return text if len(text) <= max_len else text[:max_len]


async def upsert_card(session: AsyncSession, card: dict[str, Any]) -> str | None:
    card = {
        **card,
        "external_id": _trunc(card["external_id"], 80) or card["external_id"],
        "name": _trunc(card["name"], 300) or card["name"],
        "normalized_name": _trunc(card.get("normalized_name") or normalize_name(card["name"]), 300),
        "set_code": _trunc(card.get("set_code"), 20),
        "set_name": _trunc(card.get("set_name"), 200),
        "card_number": _trunc(card.get("card_number"), 20),
        "rarity": _trunc(card.get("rarity"), 30),
        "card_type": _trunc(card.get("card_type"), 200),
        "game_specific_type": _trunc(card.get("game_specific_type"), 200),
    }
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.card_catalog (
                  game_code, external_id, set_code, set_name, card_number, name,
                  normalized_name, rarity, card_type, game_specific_type,
                  legality, image_url, game_data, last_synced_at,
                  external_ids, image_uris, language, source, version, is_reprint
                ) VALUES (
                  :game_code, :external_id, :set_code, :set_name, :card_number, :name,
                  :normalized_name, :rarity, :card_type, :game_specific_type,
                  CAST(:legality AS jsonb), :image_url, CAST(:game_data AS jsonb), NOW(),
                  CAST(:external_ids AS jsonb), CAST(:image_uris AS jsonb), :language, :source,
                  :version, :is_reprint
                )
                ON CONFLICT (game_code, external_id) DO UPDATE SET
                  name = EXCLUDED.name,
                  normalized_name = EXCLUDED.normalized_name,
                  set_code = EXCLUDED.set_code,
                  set_name = EXCLUDED.set_name,
                  card_number = EXCLUDED.card_number,
                  rarity = EXCLUDED.rarity,
                  card_type = EXCLUDED.card_type,
                  game_specific_type = EXCLUDED.game_specific_type,
                  legality = EXCLUDED.legality,
                  image_url = EXCLUDED.image_url,
                  game_data = EXCLUDED.game_data,
                  external_ids = EXCLUDED.external_ids,
                  image_uris = EXCLUDED.image_uris,
                  language = EXCLUDED.language,
                  source = EXCLUDED.source,
                  version = EXCLUDED.version,
                  is_reprint = EXCLUDED.is_reprint,
                  last_synced_at = NOW()
                RETURNING id
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
                "legality": json.dumps(card.get("legality") or {}),
                "image_url": card.get("image_url"),
                "game_data": json.dumps(card.get("game_data") or {}),
                "external_ids": json.dumps(card.get("external_ids") or {}),
                "image_uris": json.dumps(card.get("image_uris") or {}),
                "language": card.get("language") or "en",
                "source": card.get("source") or card["game_code"].lower(),
                "version": int(card.get("version") or 1),
                "is_reprint": bool(card.get("is_reprint")),
            },
        )
    ).mappings().first()
    card_id = str(row["id"]) if row else None

    price_usd = card.get("price_usd")
    if card_id and price_usd is not None:
        try:
            cents = int(float(price_usd) * 100)
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.card_prices (card_id, source, currency, price_cents, condition, foil)
                    VALUES (:cid, :src, 'USD', :cents, 'NM', :foil)
                    """
                ),
                {
                    "cid": card_id,
                    "src": card.get("source") or "market",
                    "cents": cents,
                    "foil": bool(card.get("foil")),
                },
            )
        except (TypeError, ValueError):
            pass

    return card_id
