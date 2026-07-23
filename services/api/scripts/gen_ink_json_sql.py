"""Gera SQL compacto (jsonb_to_recordset) para backfill ink no projeto MCP."""

from __future__ import annotations

import json
import re
from pathlib import Path

import httpx

OUT = Path(__file__).resolve().parent / "_ink_json"


def _norm_num(raw: object) -> str:
    text_v = str(raw or "").strip()
    return re.sub(r"^0+(?=\d)", "", text_v) or text_v


def main() -> None:
    cards = httpx.get("https://api.lorcana-api.com/bulk/cards", timeout=90).json()
    rows: list[dict] = []
    for card in cards:
        set_code = str(card.get("Set_ID") or "").upper().strip()
        num = _norm_num(card.get("Card_Num") or "")
        color = str(card.get("Color") or "").strip()
        if not set_code or not num or not color:
            continue
        colors = [p.strip() for p in color.split(",") if p.strip()]
        rows.append({"s": set_code, "n": num, "i": color, "c": colors})

    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.sql"):
        old.unlink()

    size = 400
    for i in range(0, len(rows), size):
        chunk = rows[i : i + size]
        payload = json.dumps(chunk, separators=(",", ":"))
        payload_sql = payload.replace("'", "''")
        sql = f"""UPDATE tcg_judge.card_catalog c
SET game_data = COALESCE(c.game_data, '{{}}'::jsonb)
  || jsonb_build_object('ink', v.i, 'colors', to_jsonb(v.c))
FROM jsonb_to_recordset('{payload_sql}'::jsonb)
  AS v(s text, n text, i text, c text[])
WHERE c.game_code = 'LORCANA'
  AND UPPER(c.set_code) = v.s
  AND regexp_replace(COALESCE(c.card_number::text, ''), '^0+', '') = v.n;
"""
        path = OUT / f"p{i // size:02d}.sql"
        path.write_text(sql, encoding="utf-8")
        print(path.name, len(chunk), len(sql))

    print("total_rows", len(rows), "files", len(list(OUT.glob('*.sql'))))


if __name__ == "__main__":
    main()
