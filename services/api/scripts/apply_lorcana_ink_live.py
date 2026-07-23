"""Aplica ink no banco apontado por DATABASE_URL / SUPABASE_DB_URL."""

from __future__ import annotations

import asyncio
import json
import os
import re
from pathlib import Path

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

ROOT = Path(__file__).resolve().parents[1]


def _load_env() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def _normalize_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _norm_num(raw: str) -> str:
    text_v = (raw or "").strip()
    return re.sub(r"^0+(?=\d)", "", text_v) or text_v


async def main() -> None:
    _load_env()
    url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not url:
        raise SystemExit("sem DATABASE_URL")
    print("target", url.split("@")[-1][:80])

    async with httpx.AsyncClient(timeout=90.0) as client:
        res = await client.get("https://api.lorcana-api.com/bulk/cards")
        res.raise_for_status()
        cards = res.json()

    rows: list[tuple[str, str, str, list[str]]] = []
    for card in cards:
        set_code = str(card.get("Set_ID") or card.get("set") or "").upper().strip()
        num = _norm_num(str(card.get("Card_Num") or card.get("collector_number") or ""))
        color = str(card.get("Color") or "").strip()
        if not set_code or not num or not color:
            continue
        colors = [p.strip() for p in color.split(",") if p.strip()]
        rows.append((set_code, num, color, colors))

    engine = create_async_engine(_normalize_url(url), pool_pre_ping=True)
    total = 0
    async with engine.begin() as conn:
        before = await conn.execute(
            text(
                "SELECT COUNT(*) FROM tcg_judge.card_catalog "
                "WHERE game_code='LORCANA' AND game_data ? 'ink'"
            )
        )
        print("before_ink", before.scalar())
        for i in range(0, len(rows), 100):
            chunk = rows[i : i + 100]
            values = ",\n".join(
                f"('{s}', '{n}', '{ink.replace(chr(39), chr(39)+chr(39))}', "
                f"'{json.dumps(colors)}'::jsonb)"
                for s, n, ink, colors in chunk
            )
            stmt = f"""
            UPDATE tcg_judge.card_catalog c
            SET game_data = COALESCE(c.game_data, '{{}}'::jsonb)
              || jsonb_build_object('ink', v.ink, 'colors', v.colors)
            FROM (VALUES
            {values}
            ) AS v(set_code, card_number, ink, colors)
            WHERE c.game_code = 'LORCANA'
              AND UPPER(c.set_code) = v.set_code
              AND regexp_replace(COALESCE(c.card_number::text, ''), '^0+', '') = v.card_number
            """
            result = await conn.execute(text(stmt))
            total += result.rowcount or 0
            print(f"batch {i // 100 + 1} rowcount={result.rowcount}")
        after = await conn.execute(
            text(
                "SELECT COUNT(*) FROM tcg_judge.card_catalog "
                "WHERE game_code='LORCANA' AND game_data ? 'ink'"
            )
        )
        print("after_ink", after.scalar(), "updated_rows", total)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
