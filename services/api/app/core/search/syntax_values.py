"""Autocomplete de valores para syntax search do marketplace."""

from __future__ import annotations

import html
import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.search.syntax_parser import syntax_parser
from app.core.search.syntax_values_cache import get_syntax_values_cache, set_syntax_values_cache

VALID_SYNTAX_VALUE_FIELDS = frozenset({"set", "color", "colors", "artist", "rarity", "type", "types"})

_GAME_CODE_MAP = {
    "mtg": "MTG",
    "magic": "MTG",
    "pokemon": "POKEMON",
    "ygo": "YGO",
    "lorcana": "LORCANA",
    "fab": "FAB",
    "onepiece": "ONEPIECE",
    "digimon": "DIGIMON",
    "swu": "SWU",
}


def _highlight(value: str, query: str) -> str | None:
    if not query:
        return None
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    if not pattern.search(value):
        return None
    return pattern.sub(lambda m: f"<b>{html.escape(m.group(0))}</b>", html.escape(value))


def _resolve_game_code(game: str) -> str:
    slug = game.strip().lower()
    code = _GAME_CODE_MAP.get(slug, slug.upper())
    return code


async def _ensure_game(session: AsyncSession, game_code: str) -> str:
    row = (
        await session.execute(
            text(
                """
                SELECT game_code FROM tcg_judge.catalog_games
                WHERE LOWER(game_code) = LOWER(:gc) OR LOWER(slug) = LOWER(:slug)
                LIMIT 1
                """
            ),
            {"gc": game_code, "slug": game_code.lower()},
        )
    ).mappings().first()
    if row:
        return str(row["game_code"])
    if game_code.upper() in {"MTG", "POKEMON", "YGO", "LORCANA", "FAB", "ONEPIECE", "DIGIMON", "SWU"}:
        return game_code.upper()
    raise HTTPException(404, f"Jogo não encontrado: {game_code}")


async def fetch_syntax_values(
    session: AsyncSession,
    *,
    field: str,
    game: str = "mtg",
    q: str = "",
    limit: int = 10,
) -> dict[str, Any]:
    field_key = field.strip().lower()
    if field_key not in VALID_SYNTAX_VALUE_FIELDS:
        raise HTTPException(400, f"Campo inválido: {field}")

    game_slug = game.strip().lower()
    query = q.strip()
    limit = max(1, min(limit, 20))

    cached = get_syntax_values_cache(game_slug, field_key, query)
    if cached is not None:
        return {**cached, "cached": True}

    game_code = await _ensure_game(session, _resolve_game_code(game_slug))
    values: list[dict[str, Any]] = []

    if field_key == "set":
        pattern = f"{query}%" if query else "%"
        rows = (
            await session.execute(
                text(
                    """
                    SELECT cc.set_name AS value, COUNT(*)::int AS count
                    FROM tcg_judge.card_catalog cc
                    WHERE cc.game_code = :game
                      AND cc.set_name IS NOT NULL
                      AND cc.set_name <> ''
                      AND cc.set_name ILIKE :pattern
                    GROUP BY cc.set_name
                    ORDER BY count DESC, cc.set_name ASC
                    LIMIT :lim
                    """
                ),
                {"game": game_code, "pattern": pattern, "lim": limit},
            )
        ).mappings().all()
        values = [
            {
                "value": str(r["value"]),
                "count": int(r["count"] or 0),
                "highlight": _highlight(str(r["value"]), query),
            }
            for r in rows
        ]
    elif field_key in ("color", "colors"):
        rows = (
            await session.execute(
                text(
                    """
                    SELECT DISTINCT
                      TRIM(BOTH '"' FROM elem::text) AS value,
                      COUNT(*)::int AS count
                    FROM tcg_judge.card_catalog cc,
                      jsonb_array_elements_text(
                        COALESCE(cc.game_data->'colors', cc.game_data->'color_identity', '[]'::jsonb)
                      ) AS elem
                    WHERE cc.game_code = :game
                      AND elem IS NOT NULL
                      AND elem::text <> '""'
                    GROUP BY value
                    ORDER BY count DESC, value ASC
                    LIMIT :lim
                    """
                ),
                {"game": game_code, "lim": limit},
            )
        ).mappings().all()
        if not rows:
            rows = (
                await session.execute(
                    text(
                        """
                        SELECT DISTINCT cc.game_data->>'colors' AS value, COUNT(*)::int AS count
                        FROM tcg_judge.card_catalog cc
                        WHERE cc.game_code = :game
                          AND cc.game_data->>'colors' IS NOT NULL
                        GROUP BY value
                        ORDER BY count DESC
                        LIMIT :lim
                        """
                    ),
                    {"game": game_code, "lim": limit},
                )
            ).mappings().all()
        values = [
            {
                "value": str(r["value"]),
                "count": int(r["count"] or 0),
                "highlight": _highlight(str(r["value"]), query) if query else None,
            }
            for r in rows
            if r.get("value")
        ]
        if query:
            values = [v for v in values if query.lower() in v["value"].lower()]
    elif field_key == "artist":
        pattern = f"%{query}%" if query else "%"
        rows = (
            await session.execute(
                text(
                    """
                    SELECT cc.game_data->>'artist' AS value, COUNT(*)::int AS count
                    FROM tcg_judge.card_catalog cc
                    WHERE cc.game_code = :game
                      AND cc.game_data->>'artist' IS NOT NULL
                      AND cc.game_data->>'artist' ILIKE :pattern
                    GROUP BY value
                    ORDER BY count DESC
                    LIMIT :lim
                    """
                ),
                {"game": game_code, "pattern": pattern, "lim": limit},
            )
        ).mappings().all()
        values = [
            {
                "value": str(r["value"]),
                "count": int(r["count"] or 0),
                "highlight": _highlight(str(r["value"]), query),
            }
            for r in rows
            if r.get("value")
        ]
    elif field_key == "rarity":
        rows = (
            await session.execute(
                text(
                    """
                    SELECT cc.rarity AS value, COUNT(*)::int AS count
                    FROM tcg_judge.card_catalog cc
                    WHERE cc.game_code = :game AND cc.rarity IS NOT NULL
                    GROUP BY cc.rarity
                    ORDER BY count DESC
                    LIMIT :lim
                    """
                ),
                {"game": game_code, "lim": limit},
            )
        ).mappings().all()
        values = [
            {
                "value": str(r["value"]),
                "count": int(r["count"] or 0),
                "highlight": _highlight(str(r["value"]), query) if query else None,
            }
            for r in rows
        ]
        if query:
            values = [v for v in values if query.lower() in v["value"].lower()][:limit]
    elif field_key in ("type", "types"):
        pattern = f"%{query}%" if query else "%"
        rows = (
            await session.execute(
                text(
                    """
                    SELECT cc.game_data->>'type_line' AS value, COUNT(*)::int AS count
                    FROM tcg_judge.card_catalog cc
                    WHERE cc.game_code = :game
                      AND cc.game_data->>'type_line' IS NOT NULL
                      AND cc.game_data->>'type_line' ILIKE :pattern
                    GROUP BY value
                    ORDER BY count DESC
                    LIMIT :lim
                    """
                ),
                {"game": game_code, "pattern": pattern, "lim": limit},
            )
        ).mappings().all()
        values = [
            {
                "value": str(r["value"]),
                "count": int(r["count"] or 0),
                "highlight": _highlight(str(r["value"]), query),
            }
            for r in rows
            if r.get("value")
        ]

    result = {
        "field": field_key,
        "game": game_slug,
        "query": query,
        "values": values,
        "total": len(values),
        "cached": False,
    }
    set_syntax_values_cache(game_slug, field_key, query, result)
    return result


def validate_field_value(field: str, value: str, game: str = "mtg") -> tuple[bool, str | None]:
    return syntax_parser.validate_syntax_value(field, value, game)
