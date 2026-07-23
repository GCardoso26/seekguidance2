"""Gera chunks SQL de backfill ink para aplicar via MCP no projeto prod."""

from __future__ import annotations

import json
import re
from pathlib import Path

import httpx

OUT = Path(__file__).resolve().parent / "_ink_chunks"


def _norm_num(raw: object) -> str:
    text_v = str(raw or "").strip()
    return re.sub(r"^0+(?=\d)", "", text_v) or text_v


def main() -> None:
    cards = httpx.get("https://api.lorcana-api.com/bulk/cards", timeout=90).json()
    rows: list[tuple[str, str, str, list[str]]] = []
    for card in cards:
        set_code = str(card.get("Set_ID") or "").upper().strip()
        num = _norm_num(card.get("Card_Num") or "")
        color = str(card.get("Color") or "").strip()
        if not set_code or not num or not color:
            continue
        colors = [p.strip() for p in color.split(",") if p.strip()]
        rows.append((set_code, num, color, colors))

    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("chunk_*.sql"):
        old.unlink()

    for i in range(0, len(rows), 150):
        chunk = rows[i : i + 150]
        values = ",\n".join(
            "('{s}', '{n}', '{ink}', '{colors}'::jsonb)".format(
                s=s.replace("'", "''"),
                n=n.replace("'", "''"),
                ink=ink.replace("'", "''"),
                colors=json.dumps(colors).replace("'", "''"),
            )
            for s, n, ink, colors in chunk
        )
        sql = f"""UPDATE tcg_judge.card_catalog c
SET game_data = COALESCE(c.game_data, '{{}}'::jsonb)
  || jsonb_build_object('ink', v.ink, 'colors', v.colors)
FROM (VALUES
{values}
) AS v(set_code, card_number, ink, colors)
WHERE c.game_code = 'LORCANA'
  AND UPPER(c.set_code) = v.set_code
  AND regexp_replace(COALESCE(c.card_number::text, ''), '^0+', '') = v.card_number;
"""
        (OUT / f"chunk_{i // 150:02d}.sql").write_text(sql, encoding="utf-8")

    print(f"rows={len(rows)} chunks={len(list(OUT.glob('chunk_*.sql')))}")


if __name__ == "__main__":
    main()
